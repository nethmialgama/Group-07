# Software Requirements Specification (SRS)

## 1. Introduction

The Hotel Management System (HMS) is a Windows-friendly hotel operations system designed to automate core hotel activities, including room bookings, guest check-ins/check-outs, payments, and operational reporting.

Many of these tasks are currently handled using paper records or basic spreadsheets, which can lead to delays and errors, especially during peak periods. HMS addresses these issues through structured workflows, centralized data management, and role-based access.

### 1.1 Initial and Target Scale

- Initial data volume:
- Rooms: ~100
- Customer profiles: ~100-150
- Food/service items: ~30-40
- Growth expectation:
- Up to ~10,000 customer records
- High daily transaction volume

The system should be designed with query and indexing efficiency from the beginning to maintain performance as data grows.

### 1.2 Users and Stakeholders

- Receptionists
- Restaurant/service staff
- Managers/admins
- Guests (local and foreign)
- Suppliers (food, cleaning, and related service providers)

### 1.3 Key Constraints

- Basic hardware availability in some hotel departments
- Users with limited technical proficiency
- Need for a system that is easy, fast, and secure

## 2. Motivation of the Project

Stakeholders face delays, mistakes, and resource waste when hotel operations are managed with manual or semi-digital approaches. A centralized digital system is needed to maintain service quality and operational consistency as the hotel expands.

### 2.1 Business Motivation

- Streamline and accelerate day-to-day operations
- Improve staff productivity and job satisfaction
- Eliminate paper-heavy processes and reduce waste (paper/ink)
- Auto-generate reports for better decision-making
- Improve guest experience through faster service and clearer communication
- Track bookings, payments, services, and inventory from one system
- Share data across departments without duplication

## 3. Objectives of the Project

### 3.1 Automation

Automate bookings, check-ins/check-outs, billing, and routine administrative tasks to reduce manual effort.

### 3.2 Efficiency

Reduce errors and delays in managing guest details, room availability, and staff activities.

### 3.3 Accessibility

Provide a simple and practical user experience for staff with varying technology skill levels.

### 3.4 Reporting

Generate useful summaries and reports (occupancy, revenue, service sales) for management visibility.

### 3.5 Security

Protect sensitive data using login controls, authorization, and role-based access permissions.

## 4. Scope

### 4.1 In Scope

- Guest room booking and cancellation
- Guest check-in and check-out workflows
- Real-time room availability visibility
- Billing and payment processing
- Guest feedback and reviews
- Staff login with role-based access
- Automatic reporting (income, bookings, and related metrics)
- Inventory/supplies tracking
- Digital record storage (paperless operation)
- Guest notifications via email/SMS

### 4.2 Out of Scope

- Restaurant order/service management
- Integration with third-party travel agency websites
- Building the hotel public marketing website
- Native mobile application development
- Full payroll/HR system
- IoT room controls (lights/AC automation)
- Multi-language UI support
- Integration with smart locks/security cameras

## 5. Specific Requirements

### 5.1 External Interfaces

The system should support standard desktop input/output devices:

- Keyboard
- Mouse
- Monitor

#### 5.1.1 User Interface Screens

| Screen/Page             | Description                                                   |
| ----------------------- | ------------------------------------------------------------- |
| Home Page               | Overview, featured rooms, search, login/register entry points |
| Map View                | Hotel location displayed on map pins                          |
| Login/Register          | Account creation and authentication                           |
| User Dashboard          | Profile, booking history, and trip details                    |
| Hotel Details Page      | Description, facilities, reviews, gallery                     |
| Room Types Page         | Room categories, prices, features, images                     |
| Room Booking Page       | Select room, dates, guest count, special requests             |
| Payment Page            | Choose payment method and submit payment details              |
| Booking Confirmation    | Summary, invoice, refund policy, confirmation notification    |
| Cancellation Page       | Cancel booking and view refund eligibility                    |
| Review & Ratings Page   | Ratings and feedback submission                               |
| Discounts & Offers Page | Active deals, coupons, price comparisons                      |
| Admin Login Page        | Administrator authentication                                  |
| Admin Dashboard         | Administrative overview and metrics                           |
| Room Management         | Add/update room details, pricing, availability                |
| User Management         | View/update user profiles and booking history                 |
| Gallery Page            | Hotel/room photos and virtual tour content                    |
| Settings Page           | Language/currency preference settings                         |
| Contact/Help Page       | User support, complaints, FAQ links                           |

#### 5.1.2 Software Interfaces

- Email Service API
- Database API (local database)

#### 5.1.3 Hardware Interfaces

- Local web server host environment
- Desktop/laptop devices (with optional mobile/tablet access support)

#### 5.1.4 Communication Interfaces

- HTTP/HTTPS for secure communication
- API integrations for external services (for example, email notifications)

### 5.2 Functional Requirements

#### 5.2.1 Login and Authentication

1. User registration
2. User authentication
3. Forgot password
4. Password reset

#### 5.2.2 User Roles and Permissions

1. Admin:

- Full control over the system, including user management
- Ability to update payment gateway settings

2. User:

- Register account
- Select available rooms
- Update profile details (email and phone)

#### 5.2.3 Booking Creation

1. Booking availability should reflect real-time room status (available/non-available)
2. Booking modifications should be allowed before scheduled date

#### 5.2.4 Temporary Room Removal from Availability

A room can be temporarily removed from booking when:

1. It is already allocated in another active booking window
2. Staff marks it as unsuitable (broken furniture, damaged electrical items, wall/ceiling issues, etc.)

#### 5.2.5 Room Booking

1. Room selection by type and available count
2. Booking confirmation message via email after payment
3. View booking history
4. Cancel bookings

#### 5.2.6 Payments

1. Payment method and policy handling

Advance payment required by time before check-in:

- More than 30 days: 20%
- 30-20 days: 50%
- Less than 20 days: 100%

Refund eligibility by cancellation timing:

- More than 30 days: 100% refundable
- 30-20 days: 80% refundable
- 20-7 days: 70% refundable
- 7-3 days: 60% refundable
- Less than 3 days: no refund

2. Transaction records must be stored
3. Payment confirmation should be sent (email)
4. Online payment methods must be supported

#### 5.2.7 Room Filtering

Users can filter rooms by attributes such as:

- AC/non-AC
- Single bed/double bed
- Wi-Fi/non-Wi-Fi

#### 5.2.8 Room Searching

- Search and check available rooms

#### 5.2.9 Room Sorting

1. By price (to fit budget)
2. By customer rating (highest rated first)

### 5.3 Non-Functional Requirements

#### 5.3.1 Performance

1. Fast page response time
2. Low error rate under normal operations
3. Stable throughput under high load

#### 5.3.2 Logical Database Requirements

1. User account data:

- User ID
- Full name
- Email
- Password
- Contact number
- Address

2. Room data:

- Number of rooms
- Facilities (AC/non-AC etc.)
- Bed count per room

3. Booking data:

- Room ID
- Booking status (available/non-available)

4. Transaction data:

- Transaction ID
- Payment details
- Payment status (Completed/Pending/Failed)

#### 5.3.3 Reliability

1. Support customer review records
2. Regular data backups

#### 5.3.4 Availability

1. High uptime target (24/7 availability)
2. Deployment on reliable hosting/cloud platform

#### 5.3.5 Security

1. Strong user authentication (including OTP where applicable)
2. ID verification workflows
3. Password protection and secure credential storage
4. Encrypted sensitive data
5. Secure payment processing

#### 5.3.6 Maintainability

1. Well-documented codebase
2. Version control with GitHub for collaboration and change tracking

#### 5.3.7 Portability

1. Database portability (ability to adapt to other DB engines)
2. Browser independence
3. Cloud/hosting flexibility

## 6. Critical Functionalities

- Room booking and availability management:
  Prevent double booking through up-to-date room status management.

- Secure login and role-based access:
  Allow only authorized users to access role-appropriate features.

- Payment and billing:
  Process payments, apply rules, and generate accurate bills.

- Data backup and recovery:
  Automatically back up data and recover from crashes or accidental deletion.

- Report generation and summaries:
  Produce clear reports on bookings, revenue, and feedback.

## 7. Hardware and Software Requirements

### 7.1 Hardware Needed

For runtime operation:

- Server (physical or cloud) to host application and database
- Client computers (desktop/laptop) for staff and managers
- Networking devices (routers, switches, stable internet)
- Backup storage (external drives or cloud backup)
- Optional barcode/QR scanner for check-in/inventory workflows
- Printers for invoices, reports, receipts

For testing:

- Additional test machines or virtual machines (VirtualBox/VMware)
- Mobile devices/tablets (if responsive/mobile testing is required)
- Network simulation tools (for example, NetLimiter, WANem)

### 7.2 Software Needed

Development and runtime stack:

- Frontend: HTML, CSS, JavaScript (React/Angular/Vue)
- Backend: Node.js (Express), or alternatives such as Python/Java/PHP ecosystems
- Database: MySQL
- IDE/Editors: Visual Studio Code, IntelliJ IDEA, Eclipse, PyCharm
- Web servers: Apache, Nginx, IIS (as applicable)
- Version control: Git with GitHub/GitLab/Bitbucket

## 8. Notes

This SRS consolidates and standardizes the provided project requirements text into a formal format suitable for design, implementation, and stakeholder review.
