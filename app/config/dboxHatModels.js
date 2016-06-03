const hatDataSourceConfig = {
  photos: {
    name: "photos",
    source: "dropbox",
    fields: [
      { name: "tag" },
      { name: "name" },
      { name: "path_lower" },
      { name: "path_display" },
      { name: "id" },
      { name: "client_modified" },
      { name: "server_modified" },
      { name: "rev" },
      { name: "size" }
    ],
    subTables: [
    {
      name: "media_info",
      source: "dropbox",
      fields: [
        { name: "tag" }
      ],
      subTables: [
      {
        name: "metadata",
        source: "dropbox",
        fields: [
          { name: "tag" },
          { name: "time_taken" }
        ],
        subTables: [
        {
          name: "dimensions",
          source: "dropbox",
          fields: [
            { name: "height" },
            { name: "width" }
          ],
          subTables: []
        }]
      }]
    }]
  }
}

module.exports = hatDataSourceConfig;