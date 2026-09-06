# BarberBook

**Production-deployed appointment management platform for an independent barbershop.**

BarberBook is an end-to-end scheduling system that allows customers to book
and manage appointments based on real-time availability, while giving the
barber full control over services, working hours, breaks, blocked time slots
and the daily appointment calendar.

The project was designed and developed using an AI-assisted development
workflow with Claude Code and deployed to a dedicated production environment.

---

## Engineering Highlights

- End-to-end application development
- Structured relational data model and scheduling logic
- Real-time appointment availability
- Customer and administrator workflows
- Dockerized deployment
- Separate Development and Production environments
- Git/GitHub-based source control
- AI-assisted development with Claude Code
- Phone-based appointment booking via IVR / DTMF

---

## Core Capabilities

### Customer Experience

Customers can:

- Register and authenticate
- View available appointment slots
- Book appointments by service type
- Book appointments for themselves, children or other attendees
- Change existing appointments
- Submit cancellation requests
- Receive appointment-related notifications
- Recover account access

### Administration

The barber can:

- Manage working days and opening hours
- Configure service types and durations
- Define breaks during the workday
- Block specific time ranges
- Create and manage appointments manually
- Review cancellation requests
- Manage the appointment calendar
- Publish customer announcements

---

## Scheduling Model

Appointment availability is calculated dynamically according to:

- Working day boundaries
- Service duration
- Existing appointments
- Scheduled breaks
- Manually blocked time ranges

The model separates scheduling configuration from appointment data,
allowing the barber to control availability without manually managing
individual time slots.

---

## Data Model

BarberBook uses a relational data model centered around appointment scheduling
and availability.

Main entities include:

- `User`
- `Service`
- `WorkDay`
- `WorkBreak`
- `BlockedTime`
- `Appointment`
- `CancellationRequest`
- `Notification`
- `Announcement`

Key relationships include:

- A user can book multiple appointments
- A workday contains breaks, blocked periods and appointments
- A service determines appointment duration
- An appointment can generate notifications
- An appointment may have a cancellation request
- Administrative announcements are published to customers

The full ERD and entity definitions are available in [`docs/`](./docs).

---

## Tech Stack

### Application

- TypeScript
- Node.js ecosystem
- pnpm workspace / monorepo structure

### Data

- PostgreSQL
- Relational data modeling

### Infrastructure

- Docker
- Docker Compose
- Nginx
- Environment-based configuration

### Development

- Git
- GitHub
- Claude Code

---

## Development & Deployment

The project uses separate environments for development and production.

### Development

Development is performed on a dedicated DEV server with source code managed
through Git and GitHub.

### Production

The production application is deployed to a separate server.

Deployment flow:

`Development → GitHub → Production Server → Docker Compose`

The production stack is containerized and uses environment-specific
configuration rather than storing production credentials in source control.

---

## AI-Assisted Development

Claude Code was used as an AI-assisted software development tool throughout
the project.

The development process included:

- Requirements implementation
- Application development
- Data-model implementation
- Code refactoring
- Debugging
- Dependency maintenance
- Dockerization
- Deployment configuration
- Technical documentation

AI-assisted development was integrated into the engineering workflow while
the application architecture, data model, business rules and deployment
environment were managed as part of the overall solution design.

---

## IVR Booking

BarberBook also includes a phone-based booking flow using an IVR system.

The IVR integration enables customers to interact with the scheduling system
using telephone keypad input (DTMF), including appointment search by preferred
time range.

The IVR integration is being developed and validated incrementally against
the live scheduling system.

---

## Repository Structure

```text
.
├── apps/                 Application components
├── packages/             Shared packages
├── docs/                 Product and technical documentation
├── nginx/                Nginx configuration/templates
├── privacy/              Privacy-related documentation
├── security/             Security-related documentation
├── .github/              GitHub automation/configuration
├── .claude/              Claude Code project configuration
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── package.json
└── pnpm-workspace.yaml
