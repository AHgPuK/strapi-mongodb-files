# strapi-mongodb-files
Allows file hosting on the same MongoDB instance.

The package contains two modules working separately.
The provider's one is attended for upload handling within an admin section.
The plugin's one provides an access to the previously uploaded files by URL.

##Installation

```   
npm i strapi-provider-upload-mongodb strapi-plugin-mongodb-files`   
```

##Configure
```
Open Strapi admin => Plugins => FILES UPLOAD => Settings

From "Providers" dropdown box choose "MongoDB files"
```

##Settings

```
You can configure a desired path for uploaded files
Edit strapi/config/custom.json
Add mongoDbFilesUploadDir variable to the top level next to the "myCustomConfiguration".

{
  "myCustomConfiguration": "This configuration is accessible through strapi.config.myCustomConfiguration",
  "mongoDbFilesUploadDir": "files"
}

**Notes**

```
Changing a mongoDbFilesUploadDir after file uploads will result with an inaccessibility of previously uploaded files.
To fix it you need to replace the old path to the new one in "fs" collection.
```
