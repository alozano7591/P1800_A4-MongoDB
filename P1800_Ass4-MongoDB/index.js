//import dependencies 
const express = require('express');
const path = require('path');

//make use sessions. need to install as well cmd: npm install express-session
var session = require('express-session');

//setting up Express Validator -- cmd: npm install express-validator 
const {check, validationResult} = require('express-validator'); 

//set up mongoose by cmd: npm install mongoose
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/whiskystore', {
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
    
    irish: Number,
    bourbon: Number,
    scotch: Number,
    canadian: Number,
    
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
    ["irish",           32,         0],
    ["bourbon",         30,         0],
    ["scotch",          42,         0],
    ["canadian",        34,         0]
]
;


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
    
    check('irish').custom(customFruitValidation),
    check('bourbon').custom(customFruitValidation),
    check('scotch').custom(customFruitValidation),
    check('canadian').custom(customFruitValidation)
    
],function(req, res){

    const errors = validationResult(req);
    if (!errors.isEmpty()){

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
        var irish = req.body.irish;
        var bourbon = req.body.bourbon;
        var scotch = req.body.scotch;
        var canadian = req.body.canadian;

        //delivery
        var delivery = req.body.delivery;

        var totalProductsPicked = parseInt(irish + bourbon + scotch + canadian);

        var deliveryCost = 0;
        deliveryCost = GetShippingCost(delivery);

        //calc sub totals
        var subTotal = 0;
        subTotal = GetItemCost("irish", irish) + GetItemCost("bourbon", bourbon) + GetItemCost("scotch", scotch) + GetItemCost("canadian", canadian) + deliveryCost;

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
                irish : irish,
                irishTot : GetItemCost("irish", irish),
                bourbon : bourbon,
                bourbonTot : GetItemCost("bourbon", bourbon),
                scotch : scotch,
                scotchTot : GetItemCost("scotch", scotch),
                canadian : canadian,
                canadianTot : GetItemCost("canadian", canadian),

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

function GetItemCost(prodPicked, amt)
{
    let dollarAmt = 0;
    for(let i = 0; i < products.length; i++)
    {
        if(prodPicked == products[i][0])
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
        case "AB":
            taxRate = .05;
            prov = "Alberta";
        break;
        case "BC":
            taxRate = .12;
            prov = "British Columbia";
        break;
        case "MB":
            taxRate = .12;
            prov = "Manitoba";
        break;
        case "NB":
            taxRate = .15;
            prov = "New Brunswick";
        break;
        case "NL":
            taxRate = .15;
            prov = "Newfoundland and Labrador";
        break;
        case "NT":
            taxRate = .05;
            prov = "Northwest Territories";
        break;
        case "NS":
            taxRate = .15;
            prov = "Nova Scotia";
        break;
        case "NU":
            taxRate = .05;
            prov = "Nunavut";
        break;
        case "ON":
            taxRate = .13;
            prov = "Ontario";
        break;
        case "PE":
            taxRate = .15;
            prov = "Prince Edward Island";
        break;
        case "QC":
            taxRate = .14975;
            prov = "Quebec";
        break;
        case "SK":
            taxRate = .11;
            prov = "Saskatchewan";
        break;
        case "YT":
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