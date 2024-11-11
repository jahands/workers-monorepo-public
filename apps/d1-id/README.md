# d1-id

todo: Move app/ to just use hono router. I just didn't feel like doing it when migrating to this repo.

# Spec

This project is for managing unique IDs that can be used in various forms.
For example: Referencing 1Password items using IDs like: 1P-f57sd - this is easily
recognizable as a 1Password ID, which can be placed in spreadsheets/etc, and easily searched.

Another example is IDs as a Service for simple hobby image uploaders where I just want to
upload images to Object Storage without building a whole service around it - I can simply
generate unique IDs with this service.

## Endpoints

### List/create/delete users

GET /users
POST /users/:user
DELETE /users/:user

### List/create/delete namespaces for user

GET /jhands
POST /jhands/:namespace
DELETE /jhands/:namespace

### List/create/delete IDs for namespace

GET /jhands/:namespace
GET /jhands/:namespace/new
DELETE /jhands/:namespace/:id
