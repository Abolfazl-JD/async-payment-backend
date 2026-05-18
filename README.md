# README.md

````md
# Asynchronous User Credit Payment Backend

A backend service for managing user credit balances and processing payment requests asynchronously using RabbitMQ workers.

Built with scalable backend architecture principles including:

- Async job processing
- Distributed locking
- Idempotency protection
- Atomic balance deduction
- Retry mechanism with backoff
- Payment event history
- Transaction tracking
- Concurrency safety

---

# Tech Stack

This project uses:

- NestJS
- PostgreSQL
- Prisma ORM
- Redis
- RabbitMQ
- JWT Authentication
- Swagger
- Jest

# Prerequisites

Make sure the following services/tools are installed locally:

- Node.js (v18+ recommended)
- PostgreSQL
- Redis
- RabbitMQ
- npm or yarn

---

# Local Services Configuration

## PostgreSQL

Create a PostgreSQL database:

```sql
CREATE DATABASE tops;
```
````

Default local connection used in `.env`:

```env
DATABASE_URL="postgresql://postgres:12345678@localhost:5432/tops"
```

---

## RabbitMQ

Run RabbitMQ locally.

Default connection:

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

RabbitMQ Management Panel (optional):

```txt
http://localhost:15672
```

Default credentials:

```txt
username: guest
password: guest
```

---

## Redis

Run Redis locally.

Default configuration:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

# Environment Variables

Create a `.env` file in the root of the project.

Example:

```env
DATABASE_URL="postgresql://postgres:12345678@localhost:5432/tops"

RABBITMQ_URL=amqp://guest:guest@localhost:5672

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=djf90q#Ue8q@DAP#*FGNq39hq!ueq48739Vaaio
JWT_EXPIRES_IN=360000000
```

---

# Install Dependencies

```bash
npm install
```

---

# Prisma Setup

## Generate Prisma Client

```bash
npx prisma generate
```

---

## Run Database Migrations

```bash
npx prisma migrate dev
```

---

## Seed Database

Run the seed command to create the default admin user:

```bash
npx prisma db seed
```

---

# Running the Application

## Development Mode

```bash
npm run start:dev
```

---

# Swagger API Documentation

After starting the project, open:

```txt
http://localhost:3000/api
```

Swagger includes:

- Authentication APIs
- User APIs
- Payment APIs
- Admin APIs

---

# Running Tests

```bash
npm run test
```

---

## Feedback

I’m always looking to **improve my code and approach**.

    Feedback and results are appreciated, even if they are negative
