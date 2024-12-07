const fs = require('fs');
const path = require('path');
const Config = require('../../config');
const {
    anya,
    UploadFileUgu,
    getRandom,
    getBuffer,
    remini,
    enhanceImage,
    backgroundRemover
} = require('../lib');

//༺─────────────────────────────────────

anya(
    {
        name: "meme",
        alias: ['memegen'],
        react: "😂",
        need: "image",
        category: "maker",
        cooldown: 10,
        desc: "Make meme using an image and text",
        filename: __filename
    },
    async (anyaV2, pika, { args }) => {
        if (!args[0] && !pika.quoted?.text) return pika.reply("_❗Reply an image with a caption_");
        const quoted = pika.quoted ? pika.quoted : pika;
        const mime = (quoted && quoted.mimetype) ? quoted.mimetype : pika.mtype;
        if (!/image/.test(mime) || /webp/.test(mime)) return pika.reply("_Where's the image❓_");
        const { key } = await pika.keyMsg(Config.message.wait);
        const imagePath = await anyaV2.downloadAndSaveMediaMessage(quoted, getRandom(8) + ".jpg", false);
        const response = await UploadFileUgu(imagePath);
        const buffer = await getBuffer("https://api.memegen.link/images/custom/-/" + encodeURIComponent(args.length > 0 ? args.join(" ") : pika.quoted.text) + ".png?background=" + response.url);
        await anyaV2.sendMessage(pika.chat, {
          image: buffer,
          caption: "Here's your meme!\n\n> " + Config.footer
        }, { quoted:pika });
        pika.edit("> ✅ Created!", key);
        fs.promises.unlink(imagePath);
    }
)

//༺------------------------------------------------------------------------------------------------

anya(
    {
        name: 'remini',
        react: '✨',
        alias: ['hdr', 'sharp'],
        need: "image",
        category: "maker",
        cooldown: 10,
        desc: "Enhance your image using remini",
        filename: __filename
    },
    async (anyaV2, pika, { args, prefix, command }) => {
        const quoted = pika.quoted ? pika.quoted : pika;
        const mime = (quoted && quoted.mimetype) ? quoted.mimetype : pika.mtype;        
        if (!/image/.test(mime) && !/webp/.test(mime)) return pika.reply("_Where's the image❓_");      
        const keyMsg = await pika.keyMsg(Config.message.wait);
        const image = await quoted.download();        
        remini(image)
        .then(async response => {
            if (!response.status) return pika.edit('😞 The image *isn\'t available* rn senpai!', keyMsg.key);
            const buffer = Buffer.isBuffer(response.image) ? response.image : { url: response.image };
            const message =
                (args.length > 0 && args[0].toLowerCase() === "--doc")
                ? {
                    document: buffer,
                    caption: "```Here's your remini image Senpai!```",
                    mimetype: response.fileType?.mime || "image/jpeg",
                    fileName: `Anya_v2_${command}_${getRandom(8)}.${(response.fileType?.ext || "jpeg")}`
                }
                : {
                    image: buffer,
                    caption: "```Here's your remini image Senpai!```\n> Type _" + prefix + command + " --doc_ for document"
                }
            await anyaV2.sendMessage(pika.chat, message, { quoted: pika });
            await pika.deleteMsg(keyMsg.key);
        });
});

//༺------------------------------------------------------------------------------------------------

anya(
    {
        name: 'enhance',
        react: '📈',
        alias: ['unblur'],
        need: "image",
        category: "maker",
        cooldown: 10,
        desc: "Enhance your image",
        filename: __filename
    },
    async (anyaV2, pika, { args, prefix, command }) => {
        const quoted = pika.quoted ? pika.quoted : pika;
        const mime = (quoted && quoted.mimetype) ? quoted.mimetype : pika.mtype;        
        if (!/image/.test(mime) && !/webp/.test(mime)) return pika.reply("_Where's the image❓_");      
        const keyMsg = await pika.keyMsg(Config.message.wait);
        const image = await quoted.download();        
        enhanceImage(image)
        .then(async response => {
            if (!response.status) return pika.edit('😞 Darling the image *isn\'t available* rn!', keyMsg.key);
            const buffer = Buffer.isBuffer(response.image) ? response.image : { url: response.image };
            const message =
                (args.length > 0 && args[0].toLowerCase() === "--doc")
                ? {
                    document: buffer,
                    caption: "```Here's your image darling!```",
                    mimetype: response.fileType?.mime || "image/jpeg",
                    fileName: `Anya_v2_${command}_${getRandom(8)}.${(response.fileType?.ext || "jpeg")}`
                }
                : {
                    image: buffer,
                    caption: "```Here's your image darling!```\n> Type _" + prefix + command + " --doc_ for document"
                }
            await anyaV2.sendMessage(pika.chat, message, { quoted: pika });
            await pika.deleteMsg(keyMsg.key);
        });
});

//༺------------------------------------------------------------------------------------------------

anya(
    {
        name: 'bgremove',
        react: '📈',
        alias: ['removebg', 'rbg'],
        need: "image",
        category: "maker",
        cooldown: 10,
        desc: "Remove background from image",
        filename: __filename
    },
    async (anyaV2, pika, { args, prefix, command }) => {
        const quoted = pika.quoted ? pika.quoted : pika;
        const mime = (quoted && quoted.mimetype) ? quoted.mimetype : pika.mtype;        
        if (!/image/.test(mime) || /webp/.test(mime)) return pika.reply("_Where's the image❓_");      
        const keyMsg = await pika.keyMsg(Config.message.wait);
        const image = await quoted.download();        
        backgroundRemover(image)
        .then(async response => { console.log(response);
            if (!response.status) return pika.edit('😞 Darling the image *isn\'t available* rn!', keyMsg.key);
            const buffer = Buffer.isBuffer(response.image) ? response.image : { url: response.image };
            const message =
                (args.length > 0 && args[0].toLowerCase() === "--doc")
                ? {
                    document: buffer,
                    caption: "```Here's your png darling!```",
                    mimetype: response.fileType?.mime || "image/png",
                    fileName: `Anya_v2_${command}_${getRandom(8)}.png`,//${(response.fileType?.ext || "jpeg")}`
                }
                : {
                    image: buffer,
                    caption: "```Here's your png darling!```\n> Type _" + prefix + command + " --doc_ for document"
                }
            await anyaV2.sendMessage(pika.chat, message, { quoted: pika });
            await pika.deleteMsg(keyMsg.key);
        });
});
