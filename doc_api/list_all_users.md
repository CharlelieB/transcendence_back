# List all existing users

Authentication required : yes

Method : GET

Endpoint : api/users/

## Response

### On success

200 OK

```json
[
	{
		"id": 1,
		"email": "john@gmail.com",
		"username": "john",
		"following": []
	},
	{
		"id": 2,
		"email": "paul@gmail.com",
		"username": "paul",
		"following": []
	}
]
```