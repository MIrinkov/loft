/**
 * Created by hlfrmn on 5/15/2016.
 */

function getDiscount(id){

}

function calculateTimeCost(time){
    return 100;
}

function calculateTotalCost(customer){
    //timeCost stores the cost of time (without extra orders)
    var timeCost = calculateTimeCost(customer.getTimeSpentMinutes());
    // timeRate is 1 for no discounts, less with discounts
    // e.g. 0.75 for a 25% discount
    var timeRate = getDiscount(customer.id);
    timeCost = timeCost * timeRate;

    var ordersCost = calculateOrdersCost(customer.orders);
    return timeCost + ordersCost;

}
////////////////////////////////////////
//////////////  Classes  ///////////////
////////////////////////////////////////

function Customer(id, name, start) {
    this.name = name;
    this.id = id;
    this.start = start;

    this.orders = [];
    this.timeTotal = 0;
    this.moneyTotal = 0;
    // saving intervals to a variable,
    // so as to clear the intervals on destruction
    this.timeInterval = setInterval(this.updateTime.bind(this), 1000);
    this.moneyInterval = setInterval(this.updateMoney.bind(this), 1000);
}

Customer.prototype = {
    checkOut: function () {
        return this.moneyTotal;
    },
    getTimeSpentSeconds: function () {
        return Math.floor(this.timeTotal / (1000));
    },
    getTimeSpentMinutes: function () {
        return Math.floor(this.timeTotal / (1000 * 60));
    },
    updateTime: function () {
        this.timeTotal = Date.now() - this.start;
    },
    updateMoney:function () {
        this.moneyTotal = calculateTotalCost(this);
    },
    clearIntervals:function () {
        clearInterval(this.timeInterval);
        clearInterval(this.moneyInterval);
    }
};

Customer.validate = function (obj) {
    if ((!obj.name) || (obj.name === '')){
        console.log('Customer name validation failed.');
        return false;
    }
    if ((!obj.id) || (!obj.id > 0)){
        console.log('Customer id validation failed.');
        return false;
    }
    return true;
};


//////////////////////////  MVC  //////////////////////////////


 //////////////////////////////////////////////////////////////
 ////////////////////////  MODEL  /////////////////////////////
 //////////////////////////////////////////////////////////////


var model = {
    init: function () {
        this.customers = [];
    },
    addCustomer: function (obj) {
        if (Customer.validate(obj)) {
            var customer = new Customer(obj.id, obj.name, (Date.now()));
            this.customers.push(customer);
        }
        else {
            console.log('Customer data validation error on creation!');
        }
    },
    deleteCustomer: function (customer) {
        var index = this.customers.indexOf(customer);
        if (index > -1) {
            customer.clearIntervals();
            this.customers.splice(index, 1);
        }
        else {
            console.log('Deletion error: customer not in the list!');
        }
    },
    getAllCustomers: function () {
        return this.customers;
    },
    deleteAllCustomers:function () {
        this.customers.forEach(function (customer) {
            customer.clearIntervals();
        });
        this.customers.length = 0;
    }

};

////////////////////////////////////////////////////////////////
//////////////////////////  VIEW  //////////////////////////////
////////////////////////////////////////////////////////////////

var view = {
    init: function () {
        this.customerList = document.getElementById('customer-list');
        this.customerDetails = document.getElementById('customer-details');
        this.customerTimeValue = document.getElementById('customer-time-value');
        this.customerMoneyValue = document.getElementById('customer-money-value');
        this.render();
    },
    render: function () {
        // render customer list: first clear it,
        // then render blocks for each customer
        this.customerList.innerHTML = '';
        controller.getAllCustomers().forEach(function (customer) {
            view.createCustomerBlock(customer);
        });
    },
    renderDetails:function (customer) {
        var h2 = document.createElement('h2');
        h2.textContent = customer.name + ' - ' + customer.id;
        
        this.customerTimeValue.textContent = customer.getTimeSpentMinutes();
        this.customerMoneyValue.textContent = customer.moneyTotal;

    },
    createCustomerBlock: function (customer) {
        var div = document.createElement('div');

        var custName = document.createElement('span');
        custName.textContent = customer.name;
        var custId = document.createElement('span');
        custId.textContent = customer.id;
        var custTime = document.createElement('span');
        custTime.textContent = customer.timeTotal;
        var custMoney = document.createElement('span');
        custMoney.textContent = customer.moneyTotal;

        div.appendChild(custName);
        div.appendChild(custId);
        div.appendChild(custTime);
        div.appendChild(custMoney);

        div.addEventListener('click', (function (customer) {
            return function () {
                view.renderDetails(customer);
            }
        })(customer));

        this.customerList.appendChild(div);
    }
};

////////////////////////////////////////////////////////////////
///////////////////////  CONTROLLER  ///////////////////////////
////////////////////////////////////////////////////////////////

var controller = {
    init: function () {
        model.init();
        view.init();
    },
    addCustomer: function (obj) {
        model.addCustomer(obj);
        view.render();
    },
    deleteCustomer: function (customer) {
        model.deleteCustomer(customer);
    },
    getAllCustomers: function () {
        return model.getAllCustomers();
    }
};

controller.init();