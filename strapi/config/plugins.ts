export default ({ env }) => ({
  // Cloudinary is used only when credentials are provided (production); locally files go to public/uploads
  ...(env('CLOUDINARY_NAME') && {
    upload: {
      config: {
        provider: 'cloudinary',
        providerOptions: {
          cloud_name: env('CLOUDINARY_NAME'),
          api_key: env('CLOUDINARY_KEY'),
          api_secret: env('CLOUDINARY_SECRET'),
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    },
  }),
});
