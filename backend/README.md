# Door Management System - Backend

Ky është backend-i i sistemit të menaxhimit të porosive për dyer garazhi.

## Kërkesat

- Node.js (version 14 ose më i lartë)
- PostgreSQL
- npm ose yarn

## Instalimi

1. Klono repositorinë
2. Instalo dependencat:
```bash
npm install
```

3. Krijo një bazë të dhënash PostgreSQL me emrin `door_management`

4. Krijo një file `.env` në folderin root dhe plotëso variablat e mëposhtëm:
```
PORT=5000
DB_NAME=door_management
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
JWT_SECRET=your_jwt_secret_key_here
```

5. Nis serverin:
```bash
npm start
```

## API Endpoints

### Autentifikimi
- `POST /api/users/login` - Hyrje në sistem
- `POST /api/users/register` - Regjistrim i përdoruesit të ri (vetëm admin)
- `GET /api/users/me` - Merr të dhënat e përdoruesit aktual

### Porositë
- `POST /api/orders` - Krijo porosi të re
- `GET /api/orders` - Merr të gjitha porositë
- `GET /api/orders/day/:dita` - Merr porositë sipas ditës
- `GET /api/orders/:id` - Merr porosi sipas ID
- `PUT /api/orders/:id` - Përditëso porosi
- `DELETE /api/orders/:id` - Fshi porosi (vetëm admin)

### Pagesat
- `POST /api/payments` - Krijo pagesë të re
- `GET /api/payments` - Merr të gjitha pagesat
- `GET /api/payments/type/:menyraPageses` - Merr pagesat sipas llojit
- `DELETE /api/payments/:id` - Fshi pagesë (vetëm admin)

### Kapaciteti Ditor
- `POST /api/capacity` - Cakto kapacitet për ditë (vetëm admin)
- `GET /api/capacity` - Merr të gjitha kapacitetet
- `GET /api/capacity/:dita` - Merr kapacitet sipas ditës
- `PUT /api/capacity/:id` - Përditëso kapacitet (vetëm admin)

## Siguria

- Të gjitha endpointet (përveç login) kërkojnë autentifikim
- Vetëm adminët mund të fshijnë pagesat dhe të caktojnë kapacitetin ditor
- Fjalëkalimet ruhen të hash-uara në bazën e të dhënave 