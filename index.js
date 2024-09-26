import { readFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs';
import { parse } from 'csv-parse';
import sharp from 'sharp';
import axios from 'axios';

const productsFile = readFileSync('products.csv', 'utf8');

async function parseCSV(csvString) {
    return new Promise((resolve, reject) => {
        parse(csvString, { columns: true, delimiter: ',' }, (err, records) => {
            if (err) {
                reject(err);
            } else {
                resolve(records);
            }
        });
    });
}

async function init() {
    const products = await parseCSV(productsFile);

    const images = []

    for (let i = 0; i < products.length; i++) {
        if (products[i]['Image Src']) {
            images.push(products[i]['Image Src']);
        }
        if (products[i]['Variant Image']) {
            images.push(products[i]['Variant Image']);
        }
    }

    console.log(`Found ${images.length} images from ${products.length} products`);

    // Create downloads folder if it doesn't exist
    if (!existsSync('downloads')) {
        mkdirSync('downloads');
    } else {
        // clear downloads folder
        const files = readdirSync('downloads');
        for (const file of files) {
            unlinkSync(`downloads/${file}`);
        }
    }

    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const imageParts = image.split('/');

        let imageName = imageParts[imageParts.length - 1];
        // sanitize image name
        imageName = imageName.replace(/[^a-z0-9.]/gi, '_');

        const imagePath = `downloads/${imageName}`;

        console.log(`Downloading ${image} to ${imagePath}`);

        // Download image and convert it to webp with 80 quality
        const download = await axios({
            url: image,
            responseType: 'arraybuffer',
        });
        const buffer = Buffer.from(download.data);
        await sharp(buffer)
            .webp({ quality: 80 })
            .toFile(imagePath + ".webp");
    }
}

init();