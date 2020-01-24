#!/bin/bash

# $2 "I say this"

CODEC="LINEAR16";
OUTEXT="wav"
LANG="de-de"
GENDER="MALE"
VOICE="de-DE-Wavenet-B"

while getopts k:f: OPT; do
    case $OPT in
        k)
            GOOGLE_API_KEY="$OPTARG"
            ;;
        f) # copy local ... USAGE: -l 21
            BASE_NAME="$OPTARG"
            ;;
        l) # copy local ... USAGE: -l 21
            LANG="$OPTARG"
            ;;
        g) # copy local ... USAGE: -l 21
            GENDER="$OPTARG"
            ;;
        v) # copy local ... USAGE: -l 21
            VOICE="$OPTARG"
            ;;
        x)
            # VERY BAD QUALITY! MP3 ringing!
            CODEC="MP3";
            OUTEXT="mp3"
            #OPTIONS="-vn -ac 2 -aq 5 -ar 22050 -f mp3"
            ;;
        *)
            echo "$0 -k GOOGLE_API_KEY -f basename 'text'"
            echo "$0 -m encode as mp3 directly by Google (quality sucks!)"
            echo "$0 -l de-de -v de-DE-Wavenet-B -g MALE"
            ;;
    esac
done

shift $(($OPTIND - 1))
# printf "Remaining arguments are: %s\n" "$*"

if [ -z ${GOOGLE_API_KEY+x} ]; then
    echo "-k GOOGLE_API_KEY is missing!"
    exit 1
fi

if [ -z ${BASE_NAME+x} ]; then
    echo "-f BASE_NAME defaults to 'tts' (tts.wav, tts.json, tts.base64, tts.mp3)"
    BASE_NAME="tts"
fi

INPUT="'text':'$1'"
#INPUT="'ssml':'$1'"

DATA="{ 'input':{ $INPUT }, 
        'voice':{'languageCode':'$LANG', 'name':'$VOICE', 'ssmlGender':'$GENDER'},
        'audioConfig':{'audioEncoding':'$CODEC'} }"

# HTTPS REQUEST
curl -H "X-Goog-Api-Key: ${GOOGLE_API_KEY}" \
          -H "Content-Type: application/json; charset=utf-8" \
          --data "$DATA" "https://texttospeech.googleapis.com/v1/text:synthesize" > $BASE_NAME.json

# JSON DECODING
jq -r .audioContent $BASE_NAME.json > $BASE_NAME.base64

# BASE64 DECODING
base64 -D -i $BASE_NAME.base64 -o $BASE_NAME.$OUTEXT

rm $BASE_NAME.base64

# Google's MP3 encodinbg sucks (ringing), we have to do it ourselves
if [ "$OUTEXT" == "wav" ]; then
    # -ac 1 ... is MONO should do for TTS, not good for audio-effects - needs -ac 2 for STEREO
    ffmpeg -i $BASE_NAME.wav -vn -ac 1 -aq 5 -ar 22050 -f mp3 $BASE_NAME.mp3
fi

# EXAMPLES ...

# bin/gtts.sh API_KEY tts 'Auf? zur ersten Station! Hier werden wir einen ausgeklügelten Trick der Natur genauer unter die Lupe nehmen: den Lotuseffekt. An diesem Beispiel werden wir uns anschauen, wie wasserabweisende Oberflächen funktionieren und wo in der Natursolche Oberflächen zu finden sind. An dieser Station lernst du, wie es der Lotuspflanze gelingt, sich selbst zu reinigen, welche Vertreter in der Natur diesen Effekt noch nutzen und wie es der Mensch geschafft hat, dieses Prinzip für technische Anwendungen nutzbar zu machen. Viel Spaß bei der ersten Station! Los geht’s!'
