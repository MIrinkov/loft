# loft

A single page application wriiten for a cafe to help bill the customers.

## Overview

Follows the business model, where customers are charged for time spent, and any orders are considered extra.

There is a form to create new customers. Once created, each customer is displayed in the interface
along with the time they've been in the cafe and the total bill they've accrued up to this moment.
Each customer can make orders that will get recorded and the total price for orders is reflected in 
the customer's total bill.  

Each customer can be checked-out, and there is an option to delete all customers (as per requirements,
there isn't a way to delete a single customer, although checking-out does help visually).

## Interface and usage

### Main page

Has a form to enter customer information, and two buttons: 'Add customer' and 'Delete all'.

Form:
  + **Name**: a string of text, required if **ID** is not present
  + **ID**: a string of text, required if **Name** is not present
  + **Discount**: an integer from 2 to 100, signifies the percentage of discount that will be applied to customer's *time bill*
  + **FreeMinutes**: an integer, how many minutes are free for the customer.

Also has a table showing the customers. Each row can be **clicked** to open the customer's details.

Table:
  + **Name**: the customer's name
  + **ID**: the customer's ID
  + **Time**: total time customer spent, does not reflect any discounts or free minutes.
  + **Money**: total bill, reflects *time bill* (with discounts and free minutes) and the *order bill*.

### Details

A modal window, that can be closed by pressing `ESC`, clicking the *close icon* in the top-right corner of the modal,
or clicking outside of the modal. 

  + **Customer's details**: name, id, time, money.
  + **Checkout button**: customer's **time** and **money** values will stop updating. On the main page the customer's row in the table will have red background and will be less opaque. **Lasts until page reload**.
  + **Change discount button**: shows a prompt with current discount and a field to enter a new one. **Discount** is an integer from 2 to 100
  + **Order form**:
    + **description**: a string of text, required
    + **price**: an integer, default 0 (can be used to keep notes?)
  + **Order table**: is shown if customer has orders.
    + **description**: order's description
    + **price**: order's price
    + **Delete**: removes order from the customer.
    
## Implementation

Uses **AngularJS** 1.5.8. Also uses **ng-Dialog** to display the details view in a modal.

### Services

Class factories, construct objects, have a method `#.fromObj()` to construct from object.:
  + **Customer**
  + **Order**

Singletons:
  + **loftStorage**: takes care of backing up customers to localStorage
  + **Appraiser**: holds the prices, and computes bills for time and orders.

Filters:
  + **msToTime**: converts milliseconds to a readable string: `2 h 13 m 10 s`. Seconds stop showing when hours > 1.
  + **rubleCurrency**: adds `руб` after the amount. Can also limit digits after the dot.

Controllers:
  + **MainController**:
    + holds the `customers` array
    + responsible for adding new customers from the form
    + responsible for **Delete all** button
    + `loftStorage` is injected here to backup the `customers` array
  + **DetailsController**:
    + is tied to a single customer in the `loftCustomer` directive
    + responsible for deleting and creating orders
    + responsible for **checkout** and **change discount** actions

Directives:
  + **loftCustomer**
    + bound to a single customer using the `=` binding strategy
    + creates `timeTotal` and `moneyTotal` and updates them in the `postLink` function
    + has a controller that opens the modal, and passes the directives scope into the modal
