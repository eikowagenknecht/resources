# Drop to WebP - Image Converter

A Windows batch script that converts images to WebP format while maintaining reasonable file sizes.

WebP offers superior compression compared to JPEG and PNG while maintaining high quality.
It's widely supported by modern browsers and perfect for web use.

## Features

- Converts any image format supported by ImageMagick to WebP
- Automatically resizes images that are too wide (default: 1440px)
- Applies reasonable compression (default: 85% quality)
- Preserves original files
- Supports drag & drop operation

## Requirements

- Windows
- [ImageMagick](https://imagemagick.org/script/download.php#windows) must be installed and available in PATH

## Usage

1. Download `convert-to-webp.bat`
2. Install ImageMagick if you haven't already
3. Drag and drop one or multiple images onto the script
4. Find the converted WebP files next to your originals

## Customization

You can adjust these variables at the top of the script:

```batch
set QUALITY=85      :: Output quality (0-100)
set MAX_WIDTH=1440  :: Maximum image width in pixels
```

## Example

Drag image.jpg onto convert-to-webp.bat

```plaintext
Processing: image.jpg
Image width is 2560px - resizing to 1440px
```

Result: A new `image.webp` file will be created next to `image.jpg`

## License

MIT License - Feel free to use and modify as needed.
