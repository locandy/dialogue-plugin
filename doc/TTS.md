 # Google TTS API verwenden
 
        curl -H "X-Goog-Api-Key: PUT_YOUR_API_KEY_HERE" \
          -H "Content-Type: application/json; charset=utf-8" \
          --data "{
            'input':{
              'text':'Android is a mobile operating system developed by Google,
                 based on the Linux kernel and designed primarily for
                 touchscreen mobile devices such as smartphones and tablets.'
            },
            'voice':{
              'languageCode':'en-gb',
              'name':'en-GB-Standard-A',
              'ssmlGender':'FEMALE'
            },
            'audioConfig':{
              'audioEncoding':'MP3'
            }
          }" "https://texttospeech.googleapis.com/v1beta1/text:synthesize" > tts.json

        jq -r .audioContent tts.json > tts.base64
          
        base64 -D -i tts.base64 -o tts.mp3
