# API pagination

List endpoints use offset pagination with one-based `page` and `pageSize` query parameters. The
supported maximum `pageSize` is 100; defaults are `page=1` and `pageSize=20`. A page size below 1,
above 100, or a page outside `1` to `2,147,483,647` is rejected with `422 VALIDATION_ERROR`.

The paginated endpoints are listed in the [OpenAPI reference](../reference/openapi.yaml). For
example:

```http
GET /api/v1/patients?page=2&pageSize=25
```

Each paginated response contains `items` and `meta`:

```json
{
  "items": [],
  "meta": {
    "page": 2,
    "pageSize": 25,
    "totalItems": 31,
    "totalPages": 2
  }
}
```

`totalPages` is zero when `totalItems` is zero. A valid page beyond the last page returns an empty
`items` array; it is not an error. Use `totalItems` for total counts and `totalPages` to decide
whether another page is available.

Example:

```bash
curl --cookie cookies.txt \
  'http://localhost:8080/api/v1/patients?page=1&pageSize=25'
```

Use the same filters and sort order while traversing pages. Offset pagination is not a snapshot:
concurrent inserts or deletes can move items between pages. For a stable export, use a fixed sort
and account for possible duplicates or omissions while the collection changes.
