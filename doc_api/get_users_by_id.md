# Get User by Ids

To get an array of users with specific ids

Authentication required : yes

Method : POST

Endpoint : api/users/ids/	

## Request

```json
{
    "user_ids": [1, 3]
}
```

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
		"id": 3,
		"email": "paul@gmail.com",
		"username": "paul",
		"following": []
	}
]
```

### On Failure

No specific failure

If the id does not exist you will not recieve an error (response will contains only existing id you asked for)