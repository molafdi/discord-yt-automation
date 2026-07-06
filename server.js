const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');

const app = express();
const PORT = process.env.PORT || 3000;

// رابط الـ Webhook الخاص بك (سنضعه في البيئة المخصصة له لاحقاً لحمايته)
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

// للتعامل مع البيانات التي يرسلها يوتيوب
app.use(express.text({ type: 'application/atom+xml' }));

// خطوة ضرورية ليتحقق يوتيوب من أن السيرفر يعمل
app.get('/youtube-webhook', (req, res) => {
    const challenge = req.query['hub.challenge'];
    if (challenge) {
        return res.status(200).send(challenge);
    }
    res.status(400).send('No challenge provided');
});

// استقبال التنبيه عند نشر فيديو جديد
app.post('/youtube-webhook', async (req, res) => {
    try {
        const xmlData = req.body;
        
        // تحويل بيانات الـ XML القادمة من جوجل إلى JSON سهل القراءة
        xml2js.parseString(xmlData, async (err, result) => {
            if (err || !result.feed.entry) {
                return res.status(200).send('Invalid production');
            }

            const entry = result.feed.entry[0];
            const videoId = entry['yt:videoId'][0];
            const videoTitle = entry.title[0];
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const channelName = entry.author[0].name[0];

            // تصميم الرسالة بشكل احترافي بـ Dark Aesthetic (لون بنفسجي داكن)
            const discordPayload = {
                username: channelName,
                embeds: [
                    {
                        title: `🎬 فيديو جديد على القناة!`,
                        description: `**[${videoTitle}](${videoUrl})**`,
                        url: videoUrl,
                        color: 6103492, // كود اللون البنفسجي المخصص (Hex: #5D13E8)
                        image: {
                            url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` // عرض الصورة المصغرة للفيديو
                        },
                        footer: {
                            text: "Grimor Automation System",
                        },
                        timestamp: new Date()
                    }
                ]
            };

            // إرسال التنبيه إلى ديسكورد
            await axios.post(DISCORD_WEBHOOK_URL, discordPayload);
        });

        res.status(200).send('Success');
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).send('Internal Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
