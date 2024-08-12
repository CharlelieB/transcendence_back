# How to make an API call

The path to the API endpoint always starts with /api/

Don't forget the trailing slash at the end of each endpoint

User one of those three methods : POST/GET/PUT

For POST/PUT, if a body is required, send it in JSON

If the request requires an authentification, add the authorization field to the header of your request with your access token :

Authorization: Bearer your_access_token_here

If your token is not valid your will recieve a 401 Unauthorized response and must refresh your token with the refresh token API