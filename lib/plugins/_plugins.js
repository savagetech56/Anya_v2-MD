const fs = require("fs");
const path = require('path');
const axios = require("axios");
const chalk = require("chalk");
const Config = require('../../config');
const { anya, commands, UI, Plugins, __plug, getBuffer, pickRandom, fancy13 } = require('../lib');

//༺─────────────────────────────────────

anya(
    {
        name: "plugins",
        alias: ['plugin'],
        react: "🚀",
        category: "core",
        desc: "See all plugins list",
        rule: 1,
        filename: __filename
    },
    async (anyaV2, pika, { db, args, prefix }) => {
    const external = await Plugins.find({});
    if (external.length < 1) return pika.reply("_❌ No plugins found..!_");
    const ui = db.UI?.[0] || new UI({ id: "userInterface" }).save();
    if (ui.buttons) {
        const pluginlist = external.map((item, index) => `{"header":"${item.id.charAt(0).toUpperCase() + item.id.slice(1)}","title":"","description":"𝘵𝘢𝘱 𝘩𝘦𝘳𝘦 𝘵𝘰 𝘥𝘦𝘭𝘦𝘵𝘦","id":"${prefix}delplugins ${item.id}"}`).join(',');
        const links = external.map(item => item.url).join(" ");
        const caption = "`⧉ Plugins List ⧉`\n\n> *👤 User:* @" + pika.sender.split("@")[0] + "\n> *🍉 Bot:* " + Config.botname + "\n> *🍓 Total Plugins:* " + external.length + " installed";
        return await anyaV2.sendButtonText(pika.chat, {
            text: caption,
            footer: Config.footer,
            buttons: [{ "name": "single_select", "buttonParamsJson": `{"title":"See Plugins 🧾","sections":[{"title":"⚡ 𝗣𝗹𝘂𝗴𝗶𝗻𝘀 𝗟𝗶𝘀𝘁 ⚡","highlight_label":"${Config.botname}","rows":[{"header":"🍓 Delete All Plugins 🍓","title":"","description":"click here to delete all plugins","id":"${prefix}bulkplugindelete ${links}"}]},{"title":"⚡ 𝗣𝗹𝘂𝗴𝗶𝗻𝘀 𝗟𝗶𝘀𝘁 ⚡","highlight_label":"${Config.botname}","rows":[${pluginlist}]}]}` }],
            contextInfo: { mentionedJid: [pika.sender] }
        }, { quoted: pika });
    } else {
        const pluginlist = external.map((item, index) => `*${Config.themeemoji} Url: (${index + 1}):* ${item.url}\n*🌟 File:* ${item.id}.js`).join('\n\n');
        const caption = "- _Reply 0 to delete all plugins_\n- _Reply with a specific number to delete that plugin_\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" + pluginlist + "\n\n> _ID: QA32_";
        return await anyaV2.sendMessage(pika.chat, {
            text: caption,
            contextInfo: {
                externalAdReply: {
                    showAdAttribution: true,
                    title: `🔌 Installed Plugins List`,
                    body: 'Reply with a number to delete that plugin',
                    thumbnailUrl: pickRandom(require('../database/json/flaming.json')) + "Plugins%20List",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: pika });
    }
});

//༺─────────────────────────────────────

anya(
    {
        name: 'install',
        react: '🗂️',
        category: 'core',
        rule: 1,
        desc: 'Install external plugins',
        filename: __filename
    },
    async (anyaV2, pika, { args, prefix }) => {
        if (args.length < 1) return pika.reply(`_Enter a plugin url!_\n> _Type ${prefix}pluginshop to get urls_`);
        const inp = args[0].toLowerCase();
        const gh = __plug.isGithubUsercontent(inp);
        if (!gh) return pika.reply('_Invalid format or url_');
        const exist = await Plugins.find({});
        const check = exist.map(v => v.url);
        if (check.includes(inp)) return pika.reply('_Already downloaded!_');
        const __cp = [...commands.map(f => f.name)];
        console.log(__cp);
        console.log(__cp.length);
        const { status, code, message } = await __plug.install(inp);
        const emojis = {
            200: '✅',
            400: '⚠️',
            426: '❗',
            404: '❌',
            403: '⛔',
            500: '🔧'
        };
        if (status === true && code === 200) {
            const save = await Plugins.find({});
            try {
                for (let i = 0; i < save.length; i++) {
                    const { data } = await axios.get(save[i].url);
                    await fs.promises.writeFile(__dirname + "/" + save[i].id + '.js', data, "utf8");
                }
            } catch (err) {
                return pika.reply(`_Error saving plugin files: ${err.message}_`);
            }
            await syncPlugins(__dirname);
            const updated = require('../lib/plugins');
            const __ncp = updated.commands.map(f => f.name);
            console.log(__ncp);
            console.log(__ncp.length);
            const __new = __ncp.filter(f => !__cp.includes(f));
            return pika.reply(`*${emojis[code] || '🙂‍↕️'} ${message}*\n\n\`\`\`New Commands :\`\`\`\n- ${__new.join(',\n- ')}`);
        } else {
            return pika.reply(`_${emojis[code] || '🙂‍↔️'} ${message}_`);
        }
    }
);

//༺─────────────────────────────────────

anya({ name: "delplugin", alias: ['delplugins', 'uninstall'], react: "♻️", category: "core", rule: 1, desc: "Remove external plugin commands", filename: __filename },
    async (anyaV2, pika, { args }) => {
        if (!args[0]) return pika.reply("Enter a valid `url` or `id`");
        const external = await Plugins.find({});
        let plugins;
        const input = args[0].toLowerCase();
        if (/^https:\/\/gist\.githubusercontent\.com\/.+\/.+\/raw\//.test(input)) {
            plugins = external.map(v => v.url);
        } else plugins = external.map(v => v.id);
        if (!plugins.includes(input)) return pika.reply("_Plugin does not exist._");
        const { status, statusEmoji, filename, message } = await deletePlugins(input);
        if (status === 200) {
            delete require.cache[require.resolve("./" + filename + ".js")];
            fs.unlinkSync(__dirname + "/" + filename + ".js");
            for (let i = commands.length - 1; i >= 0; i--) {
                if ((!commands[i].filename ? "yamete kudasai ahh~🥵💦" : commands[i].filename.split("/").pop()) === filename + ".js") {
                    commands.splice(i, 1);
                }
            }
            return pika.reply("*☑️Plugin Deleted!*");
        } else return pika.reply("_" + statusEmoji + message + "_");
});

//༺─────────────────────────────────────

anya(
    {
        name: "pluginstore",
        alias: ['pluginsstore'],
        react: "🍓",
        category: "core",
        desc: "External Plugins url and info store",
        filename: __filename
    },
    async (anyaV2, pika, { db, args, prefix }) => {

    /**
     * ⚠️ If anyhow you want to use this API, this is a private API
     * made for this bot specifically, it'll not work in your bot until you can use the json URLs
     */
    try {
        const { data } = await axios.get("https://raw.githubusercontent.com/PikaBotz/My_Personal_Space/main/Plugins/Anya_v2/pluginsStore.json");
        if (data.length < 1) return pika.reply("_❌ No External Plugins Are Available To Download..!_");
        const ui = db.UI?.[0] || new UI({ id: "userInterface" }).save();
        if (ui.buttons) {
            const pluginlist = data.map((item, index) => `{"header":"${item.name.charAt(0).toUpperCase() + item.name.slice(1)}","title":"${fancy13(item.type)}","description":"${item.desc}","id":"${prefix}install ${item.url}"}`).join(',');
            const links = data.map(item => item.url).join(" ");
            const caption = "`🏪 PikaBotz Plugins Store!`\n\n> *👤 User:* @" + pika.sender.split("@")[0] + "\n> *🤖 Bot:* " + Config.botname + "\n> *🧾 Available To Download:* " + data.length + " plugins";
            return await anyaV2.sendButtonText(pika.chat, {
                text: caption,
                footer: Config.footer,
                buttons: [{ "name": "single_select", "buttonParamsJson": `{"title":"Tap Here To Download 🧾","sections":[{"title":"⚡ 𝗣𝗹𝘂𝗴𝗶𝗻𝘀 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 ⚡","highlight_label":"${Config.botname}","rows":[{"header":"🍉 Install All Plugins 🍉","title":"","description":"Click here to install every plugin","id":"${prefix}bulkplugininstall ${links}"}]},{"title":"⚡ 𝗣𝗹𝘂𝗴𝗶𝗻𝘀 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 ⚡","highlight_label":"${Config.botname}","rows":[${pluginlist}]}]}` }],
                contextInfo: { mentionedJid: [pika.sender] }
            }, { quoted: pika });
        } else {
            const message = "- _Reply 0 to install all plugins_\n- _Reply with a specific number to install that plugin_\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
            const storelist = data.map((item, index) => `*${Config.themeemoji} Url: (${index + 1}):* ${item.url}\n*🌟 File:* _${item.name}_\n*🍜 Type:* _${item.type}_\n*🗣️ About:* _${item.desc.trim()}_`).join('\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n');
            return await anyaV2.sendMessage(pika.chat, {
                text: message + storelist + "\n\n> _ID: QA33_\n> " + Config.footer,
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: true,
                        title: `🏪 PikaBotz Plugins Store!`,
                        body: 'Reply with a number to install that plugin',
                        thumbnailUrl: pickRandom(require('../database/json/flaming.json')) + "Plugins%20Store",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: pika });
        }
    } catch (err) {
        console.error("Error in store API:", err);
        return pika.reply("_⚠️ ERROR:_ " + err.message);
    }
});

//༺─────────────────────────────────────

anya({ name: "bulkplugininstall", react: "🍥", notCmd: true, rule: 1, filename: __filename
}, async (anyaV2, pika, { args }) => {
    if (args.length < 1) return pika.reply(`Enter one or more plugin *urls*, separated by spaces.`);
    const reply = [];
    const invalidUrls = args.filter(url => !/^https:\/\/gist\.githubusercontent\.com\/.+\/.+\/raw\//.test(url.toLowerCase()));
    if (invalidUrls.length > 0) reply.push("_🌀Invalid URLs:_ " + invalidUrls.join(', '));
    const { key } = await pika.keyMsg(Config.message.wait);
    const external = await Plugins.find({});
    const existingPlugins = external.map(v => v.url);
    for (const i of args) {
        if (existingPlugins.includes(i.toLowerCase())) {
            reply.push("_`" + Config.themeemoji + "Plugin already exist:`_ " + i);
            continue;
        }
        try {
            const { status, statusEmoji, message } = await installPlugins(i);
            if (status === 200) {
                //const save = await Plugins.find({});
                for (let i = 0; i < args.length; i++) {
                    const {data} = await axios.get(args[i]);
                    await fs.writeFileSync(__dirname + "/" + args[i].split("/").pop(), data, "utf8");
                }
                reply.push("_`✅Plugin Installed:`_ " + i);
            } else reply.push("_" + statusEmoji + message + " :_ " + i);
        } catch (error) {
            console.error(error);
            reply.push("_‼️Error installing " + i + " :_ " + error.message);
        }
    }
    syncPlugins(__dirname);
    return pika.edit(reply.join("\n\n"), key);
});

//༺─────────────────────────────────────

anya({ name: "bulkplugindelete", react: "🌪️", notCmd: true,rule: 1, filename: __filename
}, async (anyaV2, pika, { args }) => {
    if (args.length < 1) return pika.reply(`Enter one or more plugin *urls*, separated by spaces.`);
    const reply = [];
    const invalidUrls = args.filter(url => !/^https:\/\/gist\.githubusercontent\.com\/.+\/.+\/raw\//.test(url.toLowerCase()));
    if (invalidUrls.length > 0) reply.push("_🌀Invalid URLs:_ " + invalidUrls.join(', '));
    const { key } = await pika.keyMsg(Config.message.wait);
    const external = await Plugins.find({});
    const existingPlugins = external.map(v => v.url);
    for (const i of args) {
        if (!existingPlugins.includes(i.toLowerCase())) {
            reply.push("_`❎Plugin does not exist:`_ " + i);
            continue;
        }
        try {
            const { status, filename, statusEmoji } = await deletePlugins(i);
            if (status === 200) {
                const pluginFile = path.join(__dirname, i.split("/").pop());
                const resolvedPath = require.resolve(pluginFile);
                delete require.cache[resolvedPath];
                fs.unlinkSync(pluginFile, (err) => {
                    if (err) {
                        console.error("Error deleting the file: " + err);
                        reply.push("_❌Error deleting file:_ " + i);
                    } //else {
                    //}
                });
                for (let i = commands.length - 1; i >= 0; i--) {
                    if ((!commands[i].filename ? "yamete kudasai ahh~🥵💦" : commands[i].filename.split("/").pop()) === filename + ".js") {
                        commands.splice(i, 1);
                    }
                }
                reply.push("_`✅Plugin Deleted:`_ " + i);
            } else reply.push("_" + statusEmoji + "Error deleting " + i + " :_ " + message);
        } catch (error) {
            console.error(error);
            reply.push("_‼️Error deleting " + i + " :_ " + error.message);
        }
    }
    return pika.edit(reply.join("\n\n"), key);
});

//༺─────────────────────────────────────

const syncPlugins = async (directory) => {
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }  
    const jsFiles = files.filter((file) => path.extname(file).toLowerCase() === '.js');
    jsFiles.forEach((file) => {
      const filePath = path.join(directory, file);
      delete require.cache[require.resolve('./' + filePath)];
      const requiredModule = require('./' + filePath);
    });
  });
};
