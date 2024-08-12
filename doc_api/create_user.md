# Create a new user

To register a new user in the databse

Method : POST

Endpoint : /api/register/

Authentication required : no

## Request

```json
{
	"email": "john@gmail.com",
	"code": "john",
	"password": "qwerty12345"  
}
```

## Response

### On success

201 Created

```json
{
	"id": 1,
	"email": "john@gmail.com",
	"username": "john",
	"following": []
}
```

### On Failure

400 Bad Request

```json
{
	"error": "Email déjà enregistré"
}
```