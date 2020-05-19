# strapi-mongodb-files
Allows file hosting on the same MongoDB instance.

The package contains two modules working separately.
The provider's one is attended for upload handling within an admin section.
The plugin's one provides an access to the previously uploaded files by URL.

## Installation

```   
npm i strapi-provider-upload-mongodb strapi-plugin-mongodb-files
```

## Configure
```

To enable the provider, create or edit the file at ./extensions/upload/config/settings.json

{
  "provider": "mongodb",
  "providerOptions": {
    "collectionName": "fs",
    "mongoDbFilesUploadDir": "files"
  }
}

```
The doc source: https://strapi.io/documentation/3.0.0-beta.x/plugins/upload.html#using-a-provider

## Settings

```
You can configure a desired path for uploaded files instead default which is /files
Edit strapi/config/custom.json
Add mongoDbFilesUploadDir variable to the top level next to the "myCustomConfiguration".
Note, you don't need to add trailing slash /

{
  "myCustomConfiguration": "This configuration is accessible through strapi.config.myCustomConfiguration",
  "mongoDbFilesUploadDir": "files"
}
```

**Notes**
```
1. Uploaded files are case-sensitive
2. No file duplication is allowed
3. Changing a mongoDbFilesUploadDir after file uploads 
   will result with an inaccessibility of previously uploaded files at "Files Upload" of strapi.
To fix it you need to replace the old path to the new one in "upload_file" collection of strapi.
```
