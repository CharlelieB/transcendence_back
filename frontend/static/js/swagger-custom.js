window.onload = function() {
    const ui = SwaggerUIBundle({
        url: "/api/schema/",
        dom_id: '#swagger-ui',
        presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
        deepLinking: true,
        requestInterceptor: (req) => {
            if (req.loadSpec) return req;

            let token = localStorage.getItem('token');
            if (token) {
                req.headers['Authorization'] = 'Bearer ' + token;
            }
            return req;
        }
    })

    ui.initOAuth({
        clientId: "your-client-id",
        clientSecret: "your-client-secret",
        realm: "your-realms",
        appName: "your-app-name",
        scopeSeparator: " ",
        additionalQueryStringParams: {}
    });

    window.ui = ui;
};
