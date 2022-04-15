//import dependencies 
const express = require('express');
const path = require('path');

//make use sessions. need to install as well cmd: npm install express-session
var session = require('express-session');

//setting up Express Validator -- cmd: npm install express-validator 
const {check, validationResult} = require('express-validator'); 

//set up mongoose by cmd: npm install mongoose
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/bikestore', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//setting up my order info
const Order = mongoose.model('Order',{
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
    province: String,
    
    ccm: Number,
    electric: Number,
    bmx: Number,
    mountain: Number,
    
    deliveryCost : Number,
    subTotal: Number,
    tax: Number,
    total: Number

})

// set up variables to use packages  -- cmd: npm install express
var myApp = express();
myApp.use(express.urlencoded({extended:false})); // new way after Express 4.16

//set up views and public folders
myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname+'/public')); 
myApp.set('view engine', 'ejs');

//home page
myApp.get('/', function(req, res){
    res.render('home');
});

//defining regular expressions
var phoneRegex = /^[0-9]{3}\-[0-9]{3}\-[0-9]{4}$/;
var posNumRegex = /^(0|[1-9][0-9]{0,9})$/;
var postalRegex = /[A-Za-z]\d[A-Za-z]([-]| )?\d[A-Za-z]\d/;

var products = [
    ["ccm",                300,         0],
    ["electric",           450,          0],
    ["bmx",                550,          0],
    ["mountain",            400,          0]
];

//function to check a value using regular expression
function checkRegex(userInput, regex){
    if(regex.test(userInput)){
        return true;
    }
    else{
        return false;
    }
}

// Custom phone validation function
function customPhoneValidation(value){
    if(!checkRegex(value, phoneRegex)){
        throw new Error('Phone should be in the format xxx-xxx-xxxx');
    }
    return true;
}

function customPostalCodeValidation(value){
    if(!checkRegex(value, postalRegex)){
        throw new Error('Postal code should be in the format X1X-1X1');
    }
    return true;
}

function customFruitValidation(value){
    if(!checkRegex(value, posNumRegex)){
        throw new Error('Product number needs to be a positive number.');
    }
    return true;
}

myApp.post('/', [
    check('name', 'Please enter a name').notEmpty(),
    check('email', 'Please enter a valid email, ie, example@email.com').isEmail(),
    check('phone').custom(customPhoneValidation),
    check('address', 'Please Enter Address').notEmpty(),
    check('city', 'Please enter a city').notEmpty(),
    check('postalCode', 'Please enter a valid postal code').custom(customPostalCodeValidation),
    check('province', 'Please select a province').notEmpty(),
    
    check('ccm').custom(customFruitValidation),
    check('electric').custom(customFruitValidation),
    check('bmx').custom(customFruitValidation),
    check('mountain').custom(customFruitValidation)
    
],function(req, res){

    const errors = validationResult(req);
    if (!errors.isEmpty()){

        for(let i = 0; i < errors.length; i++)
        {
            errorString += errors[i].toString() + "\n";
        }

        res.render('home', {
            errors:errors.array()
        });
        
    }
    else{
        //customer info
        var name = req.body.name;
        var email = req.body.email;
        var phone = req.body.phone;
        var address = req.body.address;
        var city = req.body.city;
        var postalCode = req.body.postalCode;
        var province = req.body.province;

        //product-purchase info sale
        var ccm = req.body.ccm;
        var electric = req.body.electric;
        var bmx = req.body.bmx;
        var mountain = req.body.mountain;

        //delivery
        var delivery = req.body.delivery;

        var totalProductsPicked = parseInt(ccm + electric + bmx + mountain);

        var deliveryCost = 0;
        deliveryCost = GetShippingCost(delivery);

        //calc sub totals
        var subTotal = 0;
        subTotal = GetBikeCost("ccm", ccm) + GetBikeCost("electric", electric) + GetBikeCost("bmx", bmx) + GetBikeCost("mountain", mountain) + deliveryCost;

        //get tax info
        var taxRate = GetTaxRate(province); 
        var tax = subTotal * taxRate;
        var total = subTotal + tax;

        if(totalProductsPicked >= 1)
        {
            var pageData = {
                name : name,
                email : email,
                phone : phone, 
                address : address,
                city : city,
                postalCode : postalCode,
                province : province,

                //bikes
                ccm : ccm,
                ccmTot : GetBikeCost("ccm", ccm),
                electric : electric,
                electricTot : GetBikeCost("electric", electric),
                bmx : bmx,
                bmxTot : GetBikeCost("bmx", bmx),
                mountain : mountain,
                mountainTot : GetBikeCost("mountain", mountain),

                //totals
                deliveryCost : deliveryCost,
                subTotal : subTotal,
                tax : tax,
                total : total

            }

            //create object
            var myOrder = new Order(pageData);

            //save order
            myOrder.save().then(function(){
                console.log("New order created");
            });

            //display
            res.render('home', pageData);
        }
        else{
            res.render('home', {error2:"ERROR, you must purchase at least one product"});
        }

    }
    
});

function GetBikeCost(bikePicked, amt)
{
    let dollarAmt = 0;
    for(let i = 0; i < products.length; i++)
    {
        if(bikePicked == products[i][0])
        {
            dollarAmt = parseInt(products[i][1]) * amt;
            return dollarAmt;
        }
    }
    return dollarAmt;
}

function GetTaxRate(prov)
{

    var taxRate = 0;

    switch(prov){
        case "Alb":
            taxRate = .05;
            prov = "Alberta";
        break;
        case "BC":
            taxRate = .12;
            prov = "British Columbia";
        break;
        case "Man":
            taxRate = .12;
            prov = "Manitoba";
        break;
        case "NewB":
            taxRate = .15;
            prov = "New Brunswick";
        break;
        case "Newf":
            taxRate = .15;
            prov = "Newfoundland and Labrador";
        break;
        case "NorthT":
            taxRate = .05;
            prov = "Northwest Territories";
        break;
        case "NS":
            taxRate = .15;
            prov = "Nova Scotia";
        break;
        case "Nun":
            taxRate = .05;
            prov = "Nunavut";
        break;
        case "Ont":
            taxRate = .13;
            prov = "Ontario";
        break;
        case "PEI":
            taxRate = .15;
            prov = "Prince Edward Island";
        break;
        case "Qeb":
            taxRate = .14975;
            prov = "Quebec";
        break;
        case "Sask":
            taxRate = .11;
            prov = "Saskatchewan";
        break;
        case "Yuk":
            taxRate = .05;
            prov = "Yukon";
        break;
    }

    return taxRate;
}

function GetShippingCost(shipping)
{
    shipCost = 0;
    switch(shipping)
    {
        case "Del1":
            shipCost = 19.99;
        break;
        case "Del3":
            shipCost = 12.99;
        break;
        case "Del7":
            shipCost = 4.99;
        break;
    }

    return shipCost;

}

// All orders page
myApp.get('/allorders',function(req, res){
    Order.find({}).exec(function(err, orders){
        res.render('allorders', {orders:orders});
    });
        
});

//listen to port 8080 because i say so
myApp.listen(8080);
console.log('Everything executed fine.. Open http://localhost:8080/');