# Como criar o usuário Davi

## Opção 1: Via API (quando o servidor estiver rodando)

```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "558481843434",
    "email": "davirdr344@gmail.com",
    "name": "Davi"
  }'
```

## Opção 2: Via script (precisa do MongoDB rodando)

```bash
# Certifique-se que o MongoDB está rodando
# No diretório backend, execute:
node scripts/createUser.js
```

## Opção 3: Direto no MongoDB

```javascript
// No MongoDB shell ou Compass
use newsletter-whatsapp

db.users.insertOne({
  phone: "558481843434",
  email: "davirdr344@gmail.com",
  name: "Davi",
  subscriptionStatus: "active",
  subscriptionId: null,
  trialStartDate: new Date(),
  trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
  deliveryTime: "10:00",
  timezone: "America/Sao_Paulo",
  profileDescription: "",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Acessar o perfil

Depois de criar, acesse:
http://localhost:3001/profile/558481843434