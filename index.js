// Importa le librerie necessarie
require('dotenv').config()
const axios = require('axios');
const fs = require('fs');
const { Client, GatewayIntentBits, REST, Routes, AttachmentBuilder } = require('discord.js');

// Crea una nuova istanza del client con gli intents necessari
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

// Crea una nuova istanza di REST
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// Accedi a Discord con il tuo token bot
client.login(process.env.BOT_TOKEN);

// Aspetta che il client sia pronto
client.on('ready', async () => {
    console.log('Il bot è pronto!');

    // Crea un comando slash chiamato /speak con due opzioni: text e voice_id
    const commands = [
        {
            name: 'speak',
            description: 'Fai parlare il bot con una voce di Eleven Labs',
            type: 1,
            options: [
                {
                    name: 'text',
                    description: 'Il testo da pronunciare',
                    type: 3,
                    required: true,
                },
                {
                    name: 'voice_id',
                    description: 'L\'ID della voce da utilizzare',
                    type: 3,
                    required: false,
                },
                {
                    name: 'stability',
                    description: 'Aumenta stabilità per coerenza vocale. Su testi lunghi, consigliamo valori più bassi.',
                    type: 10,
                    required: false,
                },
                {
                    name: 'similarity_boost',
                    description: 'Aumenta chiarezza e somiglianza con lo speaker. Valori alti possono causare artefatti.',
                    type: 10,
                    required: false,
                },
                {
                    name: 'style',
                    description: 'Regola stile del discorso rispetto all’audio. Valori alti possono causare instabilità.',
                    type: 10,
                    required: false,
                },
            ],
        },
    ];



    // Registra i tuoi comandi con Discord
    try {
        console.log('Iniziato a caricare i comandi...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );
        console.log('Comandi caricati!');
    } catch (error) {
        console.error(error);
    }
});

// Ascolta le interazioni dei comandi slash
client.on('interactionCreate', async (interaction) => {
    console.log(`Ricevuta interazione: ${interaction.commandName}`);
    // Rispondi immediatamente all'interazione con un messaggio di caricamento
    await interaction.deferReply();
    // Controlla se l'interazione è un comando slash
    if (interaction.isCommand()) {
        console.log('Risposta differita inviata');
        // Controlla se il comando è /speak
        if (interaction.commandName === 'speak') {
            console.log('Comando /speak rilevato');
            // Ottieni il testo e l'ID della voce dalle opzioni o usa un valore predefinito
            const textInput = interaction.options.getString('text') || 'In assenza di un input testuale non posso dire nulla!';
            const voiceID = interaction.options.getString('voice_id') || 'pNInz6obpgDQGcFmaJgB';
            const stability = interaction.options.getNumber('stability') || 0.3;
            const similarityBoost = interaction.options.getNumber('similarity_boost') || 1;
            const style = interaction.options.getNumber('style') || 0.5;
            console.log(interaction.options.getString('text'));
            console.log(voiceID);
            console.log(stability);
            console.log(similarityBoost);
            console.log(style);
            try {
                console.log('Generazione del discorso in corso...');
                // Genera un discorso dal testo utilizzando l'API di Eleven Labs
                const fileName = "audio.mp3";
                const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceID}`, {
                    text: textInput,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: {
                        stability,
                        similarity_boost: similarityBoost,
                        style,
                        use_speaker_boost: true,
                    },
                }, {
                    headers: {
                        'xi-api-key': process.env.ELEVEN_API_KEY,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg',
                    },
                    responseType: 'arraybuffer',
                });
                fs.writeFileSync(fileName, response.data);
                console.log('Discorso generato con successo');

                // Crea un allegato di messaggio con il file di discorso
                const attachment = new AttachmentBuilder(fileName);

                // Modifica la risposta all'interazione con l'allegato
                await interaction.editReply({
                    content: `Ecco il discorso generato:`,
                    files: [attachment],
                });
            } catch (error) {
                // Gestisci eventuali errori
                console.error(error);
                await interaction.editReply('Spiacente, qualcosa è andato storto.');
            }
        }
    }
});