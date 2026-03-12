# Alicious Delicious Cakes 🍰

Alicious Delicious Cakes is a full-stack web platform I built to help my mum manage her home bakery business.
The goal of the system is to simplify how customers place cake orders while giving the bakery owner tools to track orders, manage production stages, handle payments, and monitor business finances.

The platform solves several real challenges my mum faced in her business such as:

• Difficulty managing incoming orders
• Last-minute cancellations by customers
• Tracking cake production stages
• Monitoring expenses and profits

By digitizing the ordering and production workflow, the system provides customers with a smooth ordering experience while giving her the full visibility into the state of every order.

---

## Project Overview

Customers can browse available cakes, place orders, and secure their order by paying a 50% deposit.
The bakery owner then updates the production status of the cake as it moves through preparation stages such as order received, baking in progress, and cake ready.

At each stage the system automatically notifies the customer via SMS, keeping them informed about their order status.

When the cake is ready, the customer logs in to complete the remaining payment before collection.

On the administrative side, the platform provides a dashboard that allows the bakery owner to:

• manage the cake catalogue
• track incoming orders
• update cake preparation stages
• log baking expenses such as ingredients, transport, and electricity
• monitor revenue, expenses, and net profit through analytics dashboards

---

## Key Features

### Customer Experience

• Browse cake catalogue with filters and search
• Secure cake orders with a 50% deposit payment
• Track order progress in real time
• Receive SMS notifications as the cake moves through production stages
• Complete remaining balance payment when cake is ready
• Access personal order history and payment status
• Leave reviews and ratings for the bakery

### Bakery Owner (Admin) Dashboard

• Add, update, and manage cake catalogue
• View and manage all customer orders
• Update order production stages (order received → baking in progress → cake ready → delivered)
• Send automated SMS notifications to customers
• Track expenses for each order such as ingredients and delivery transport
• Monitor business revenue, expenses, and profit through visual analytics

---

## Technology Stack

Frontend
React
Modern responsive UI with mobile-first design

Backend
Flask REST API
JWT authentication
Flask-SQLAlchemy ORM

Database
MySQL

Integrations
M-Pesa payment integration (deposit and balance payments)
SMS notification service

---

## Real-World Impact

This project was built to solve real operational problems for my mum’s bakery business.
It transforms a manual order process into a digital workflow that improves customer communication, reduces order cancellations, and provides clear financial insights for the business.

Beyond being a technical project, it demonstrates how software can be used to support small businesses and improve everyday operations.

---

