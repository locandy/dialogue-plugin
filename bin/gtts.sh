#!/bin/bash

# $1 API-Key
# $2 filename without extension
# $3 "I say this"

curl -H "X-Goog-Api-Key: $1" \
          -H "Content-Type: application/json; charset=utf-8" \
          --data "{
            'input':{
              'text':'$3'
            },
            'voice':{
              'languageCode':'de-de',
              'name':'de-DE-Wavenet-B',
              'ssmlGender':'MALE'
            },
            'audioConfig':{
              'audioEncoding':'LINEAR16'
            }
          }" "https://texttospeech.googleapis.com/v1/text:synthesize" > $2.json

jq -r .audioContent $2.json > $2.base64
          
base64 -D -i $2.base64 -o $2.wav

rm $2.base64

# Google's MP3 encodinbg sucks (ringing), we have to do it ourselves
ffmpeg -i $2.wav -vn -ac 2 -aq 5 -ar 22050 -f mp3 $2.mp3

# bin/gtts.sh API_KEY tts 'Auf zur ersten Station! Hier werden wir einen ausgeklügelten Trick der Natur genauer unter die Lupe nehmen: den Lotuseffekt. Andiesem Beispiel werden wir uns anschauen, wie wasserabweisende Oberflächen funktionieren und wo in der Natursolche Oberflächen zu finden sind. An dieser Station lernst du, wie es der Lotuspflanze gelingt, sich selbst zu reinigen, welche Vertreter in der Natur diesen Effekt noch nutzen und wie es der Mensch geschafft hat, dieses Prinzip für technische Anwendungen nutzbar zu machen. Viel Spaß bei der ersten Station! Los geht’s!'
