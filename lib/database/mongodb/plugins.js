 const mongoose = require('mongoose');
const axios = require('axios');
const vm = require('vm');

const Schema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    url: { type: String }
});

const Plugins = mongoose.model('plugins', Schema);

//༺─────────────────────────────────────

const validatePluginObject = (pluginObj) => {
    // List of required fields that should be present in the plugin object
    const requiredFields = ['name', 'category', 'filename'];
    
    // Validate each field in the plugin object
    for (const field of requiredFields) {
        if (!pluginObj[field]) {
            return `Missing required field '${field}' in plugin object: ${JSON.stringify(pluginObj)}`;
        }
    }
    
    return null;  // Return null if all fields are valid
};

const extractAnyaPlugins = (code) => {
    const pluginMatches = [];
    const regex = /anya\s*\(\s*({[\s\S]*?})\s*,\s*async\s*\(/g;
    let match;
    
    // Iterate through the code and try to extract plugin definitions
    while ((match = regex.exec(code)) !== null) {
        try {
            // Extract the plugin code within the brackets
            const pluginCode = `(${match[1]})`;  // Ensure the extracted code is a valid JavaScript object
            const script = new vm.Script(pluginCode);  // Create a script to run the code
            const pluginObj = script.runInNewContext();  // Run the script and extract the plugin object
            
            // Add the extracted plugin object to the array
            pluginMatches.push(pluginObj);
        } catch (err) {
            console.warn(`Failed to parse a plugin object: ${err.message}`);
        }
    }
    
    return pluginMatches;
};

const installPlugins = async (rawUrl) => {
    const url = rawUrl.toLowerCase();
    const filename = url.split("/").pop().replace(".js", "");  // Get the filename from the URL
    
    try {
        // Fetch the plugin code from the URL
        const { data: code } = await axios.get(url);
        
        // Try to create a script from the fetched code to ensure it's valid syntax
        try {
            new vm.Script(code, { filename });  // Just validate the syntax, no execution needed
        } catch (syntaxError) {
            return {
                status: 400,
                statusEmoji: "⚠️",
                message: `Syntax Error: ${syntaxError.message}`,
                filename,
                url,
            };
        }

        // Extract plugins from the code
        const plugins = extractAnyaPlugins(code);

        if (plugins.length === 0) {
            return {
                status: 400,
                statusEmoji: "⚠️",
                message: "No valid 'anya' plugins found.",
                filename,
                url,
            };
        }

        // Validate each plugin structure
        for (const plugin of plugins) {
            const validationError = validatePluginObject(plugin);
            if (validationError) {
                return {
                    status: 400,
                    statusEmoji: "⚠️",
                    message: `Invalid plugin structure: ${validationError}`,
                    filename,
                    url,
                };
            }

            // Handle `notCmd` logic: if it's true, set `name` to `false`
            if (plugin.notCmd) {
                plugin.name = false;
            }

            // Check plugin version compatibility
            const currentPluginVersion = parseInt(require('../../../package.json').plugin_v.replace(/\D/g, ''), 10);
            const modulePluginVersion = parseInt(plugin.plugin_v?.replace(/\D/g, ''), 10);
            if (modulePluginVersion < currentPluginVersion) {
                return {
                    status: 426,
                    statusEmoji: "⚠️",
                    message: "Unsupported plugin version. Please update your bot.",
                    filename,
                    url,
                };
            }
        }

        // Return success message with plugin info
        return {
            status: 200,
            statusEmoji: "✅",
            message: `Successfully validated ${plugins.length} plugin(s).`,
            plugins: plugins.map(plugin => ({
                name: plugin.name || false,  // Ensure a name is returned
                filename,
                url,
            })),
        };

    } catch (err) {
        // Handle errors during plugin fetching or execution
        if (err.response?.status === 404) {
            return {
                status: 404,
                statusEmoji: "❓",
                message: "Plugin URL not found.",
                filename,
                url,
            };
        }
        console.error("Error fetching or executing plugin:", err);
        return {
            status: 500,
            statusEmoji: "❌",
            message: "Internal Server Error. Please try again later.",
            filename,
            url,
        };
    }
};

//༺─────────────────────────────────────

const deletePlugins = async (idOrUrl) => {
    let result;
    let filename;
    try {
        
        /**
         * Raw url
         */
        const raw = idOrUrl.toLowerCase();
        if (/^https:\/\/gist\.githubusercontent\.com\/pikabotz\//.test(raw)) {
            result = await Plugins.findOneAndDelete({ url: raw });
            filename = raw.split("/").pop().split(".js")[0];
        } else {
            filename = raw.split(".js")[0];
            result = await Plugins.findOneAndDelete({ id: filename });
        }        
        if (result) {
            return {
                status: 200,
                statusEmoji: "✅",
                message: "Plugin successfully deleted.",
                filename: filename
            };
        } else {
            return {
                status: 404,
                statusEmoji: "❓",
                message: "Plugin not found.",
                filename: filename
            };
        }
    } catch (err) {
        console.log("Plugin Deletion error", err);
        return {
            status: 500,
            statusEmoji: "❌",
            message: "Internal Server Error",
            filename: filename
        };
    }
}

module.exports = { Plugins, installPlugins, deletePlugins };
