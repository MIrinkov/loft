/**
 * Created by hlfrmn on 5/15/2016.
 */
function Customer(id, name, start) {
    this.name = name;
    this.id = id;
    this.start = start;
    this.timeSpent = 0;
}

Customer.prototype = {
    checkOut: function () {
        alert('Time to pay');
    }
}

Customer.validate = function (obj) {
    if ((!obj.name) || (obj.name === '')) return false;
    if ((!obj.id) || (!obj.id > 0)) return false;
    return true;
}

// function Product(name, price) {
//     this.name = name;
//     this.price = price;
// }

var model = {
    init: function () {
        this.customers = [];
    },
    addCustomer: function (obj) {
        if (Customer.validate(obj)) {
            var customer = new Customer(obj.id, obj.name, (new Date.now()));
            this.customers.push(customer);
        }
        else {
            console.log('Customer data validation error on creation!');
        }
    },
    deleteCustomer: function (customer) {
        var index = this.customers.indexOf(customer);
        if (index > -1) {
            this.customers.splice(index, 1);
        }
        else {
            console.log('Deletion error: customer not in the list!');
        }
    },
    getAllCustomers: function () {
        return this.customers;
    }

};

var view = {
    init: function () {
        this.customerList = document.getElementById('');
        this.customerDetails = document.getElementById('');
        this.render();
    },
    render: function () {
        controller.getAllCustomers().forEach(
            view.createCustomerBlock(customer)
        );
    },

    createCustomerBlock:function (customer) {
        var div = document.createElement('div');
        var custName = document.createElement('span');
        var custId = document.createElement('span');
        var custTime = document.createElement('span');
        var custMoney = document.createElement('span');

    }
};

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