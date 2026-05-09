from main import app
for route in app.routes:
    methods = getattr(route, "methods", "N/A")
    print(f"Path: {route.path} | Methods: {methods}")
