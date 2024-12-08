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
    backgroundRemover,
    imgLarger
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
        alias: ['hdr'],
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
        let quality = 2;
        if (args.length > 0 && args.join(" ").includes("--4")) quality = 4;
        remini(image, quality)
        .then(async response => { console.log(response);
            if (!response.status) return pika.edit('😞 The image *isn\'t available* rn senpai!', keyMsg.key);
            const buffer = Buffer.isBuffer(response.image) ? response.image : await getBuffer(response.image);
            const message =
                (args.length > 0 && args.join(" ").toLowerCase().includes("--doc"))
                ? {
                    document: buffer,
                    caption: "```Here's your remini image Senpai!```",
                    mimetype: response.fileType?.mime || "image/jpeg",
                    fileName: `Anya_v2_${command}_${getRandom(8)}.${(response.fileType?.ext || "jpeg")}`
                }
                : {
                    image: buffer,
                    caption: `\`\`\`Here's your remini image Senpai!\`\`\`\n> Type _${prefix + command} --doc_ for document\n> Type _${prefix + command} --2 or --4_ for quality`
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
        alias: ['unblur', 'enhancer'],
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
            const buffer = Buffer.isBuffer(response.image) ? response.image : await getBuffer(response.image);
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
            const buffer = Buffer.isBuffer(response.image) ? response.image : await getBuffer(response.image);
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

//༺------------------------------------------------------------------------------------------------

const __imgLC = [
    { name: 'enlarge', react: '📈', desc: 'Increase image size using fast Canva algorithm.', scale: [2, 4] },
    { name: 'sharpen', alias: ['sharp'], react: '⛩️', desc: 'Sharpen blurred images instantly.' },
    { name: 'enhance2', alias: ['enhancer2', 'unblur'], react: '✨', desc: 'Enhance image clarity, quality, contrast, and brightness.', scale: [2] },
    { name: 'restore', react: '🎀', desc: 'Restore old or blurry photos and boost resolution.' },
    { name: 'expand', alias: ['uncrop'], react: '↕️', desc: 'Uncrop and expand images.' }
];

__imgLC.forEach(({ name, alias = [], react, desc, scale }) => {
    anya(
        {
            name,
            react,
            alias: alias.length ? alias : false,
            need: "image",
            category: "maker",
            cooldown: 10,
            desc,
            filename: __filename
        },
        async (anyaV2, pika, { args, prefix, command }) => {
            const quoted = pika.quoted || pika;
            const mime = quoted?.mimetype || pika.mtype;
            if (!/image|webp/.test(mime)) return pika.reply("_Where's the image❓_");
            const keyMsg = await pika.keyMsg(Config.message.wait);
            const image = await quoted.download();
            const options = parseArgs(args);
            if (['enhance2', 'enhancer2', 'unblur2'].includes(command)) options.effect = 'enhance';
            else options.effect = name;
            if (['expand', 'uncrop'].includes(name) && !options.prompt) return pika.edit('Please enter a prompt along with the image, *e.g.:* Expands the image with sunlight outside.', keyMsg.key);
            const response = await imgLarger(image, options.effect, options); console.log(response);
            if (!response.status) return pika.edit('😞 Darling, the image *isn\'t available* rn!', keyMsg.key);
            const buffer = Buffer.isBuffer(response.image) ? response.image : await getBuffer(response.image);
            const doc = args[0]?.toLowerCase() === "--doc";
            const message = doc
                ? {
                    document: buffer,
                    caption: "```Here's your image darling!```" + scale?.length > 1 ? `\n> Type _${prefix + command} --${scale.join(" or --")}_ for quality` : '',
                    mimetype: response.fileType?.mime || "image/jpeg",
                    fileName: `Anya_v2_${command}_${getRandom(8)}.${response.fileType?.ext || "jpeg"}`
                }
                : {
                    image: buffer,
                    caption: `\`\`\`Here's your image darling!\`\`\`\n> Type _${prefix + command} --doc_ for document${scale?.length > 1 ? `\n> Type _${prefix + command} --${scale.join(" or --")}_ for quality` : ''}`
                };
            await anyaV2.sendMessage(pika.chat, message, { quoted: pika });
            await pika.deleteMsg(keyMsg.key);
        }
    );
});

function parseArgs(args) {
    const options = { scale: 2, frame: null, prompt: null };
    const convo = args.join(" ");
    if (convo.includes("--4")) options.scale = 4;
    const frames = ['1:1', '1:2', '2:1', '2:3', '3:2', '9:16', '16:9'];
    frames.forEach(frame => {
        if (convo.includes(`--${frame}`)) options.frame = frame;
    });
    options.prompt = convo.replace(/\b--\S+\b/g, "").trim();
    return options;
}
