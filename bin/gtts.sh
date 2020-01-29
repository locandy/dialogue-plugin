#!/bin/bash

# $2 "I say this"

CODEC="LINEAR16";
OUTEXT="wav"
LANG="de-de"
GENDER="MALE"
VOICE="de-DE-Wavenet-B"
PITCH="0"
RATE="1"

while getopts k:f:l:g:v:i:p:r: OPT; do
    case $OPT in
        k)
            GOOGLE_API_KEY="$OPTARG"
            ;;
        f) # output filename basename
            FILE_NAME="$OPTARG"
            ;;
        l) # de-de, en-us
            LANG="$OPTARG"
            ;;
        g) # gender MALE, FEMALE, NEUTRAL
            GENDER="$OPTARG"
            ;;
        v) # voice
            VOICE="$OPTARG"
            ;;
        p) # pitch -5.1 .... +5.2
            PITCH="$OPTARG"
            ;;
        r) # rate/speed 0.7 .... 1.2
            RATE="$OPTARG"
            ;;
        i) # input SSML file say_this.ssml
            SSML_FILE=$OPTARG
            FN=$(basename $SSML_FILE)
            FILE_NAME=${FN%.*}
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
            echo "$0 -k API_KEY -i test.ssml "
            exit 1
            ;;
    esac
done

shift $(($OPTIND - 1))
# printf "Remaining arguments are: %s\n" "$*"

if [ -z ${GOOGLE_API_KEY+x} ]; then
    echo "-k GOOGLE_API_KEY is missing!"
    exit 1
fi

if [ -z ${FILE_NAME+x} ]; then
    echo '-f filename defaults to "tts" (tts.wav, tts.json, tts.base64, tts.mp3)'
    FILE_NAME="tts"
fi

if [ -z ${SSML_FILE+x} ]; then
    echo "Reading text from argument"
    INPUT="{ 'text':'$1' }"
else
    echo "Reading SSML from file: " $SSML_FILE
    
    INPUT=$(sed 's/[.]\{4\}/<break time="1500ms"\/>/g; s/[.]\{3\}/<break time="1000ms"\/>/g; s/[.]\{2\}/<break time="500ms"\/>/g' <$SSML_FILE)
    INPUT=$(echo "$INPUT" | sed 's/[*]\{2\}//g;')  # remove markdown bold
    INPUT=$(echo "$INPUT" | jq -Rs '{ "ssml": . }')    
fi

#echo "$INPUT"
#exit 0

DATA="{ 'input':$INPUT,
        'voice':{'languageCode':'$LANG', 'name':'$VOICE', 'ssmlGender':'$GENDER'},
        'audioConfig':{'audioEncoding':'$CODEC', 'pitch': $PITCH, 'speakingRate': $RATE } }"

echo $DATA > $FILE_NAME-post.json

# HTTPS REQUEST
curl -H "X-Goog-Api-Key: ${GOOGLE_API_KEY}" \
          -H "Content-Type: application/json; charset=utf-8" \
          --data-binary "@$FILE_NAME-post.json" "https://texttospeech.googleapis.com/v1/text:synthesize" > $FILE_NAME.json

# JSON DECODING
jq -r .audioContent $FILE_NAME.json > $FILE_NAME.base64

# BASE64 DECODING
base64 -D -i $FILE_NAME.base64 -o $FILE_NAME.$OUTEXT

rm $FILE_NAME.base64

# Google's MP3 encodinbg sucks (ringing), we have to do it ourselves
if [ "$OUTEXT" == "wav" ]; then
    # -ac 1 ... is MONO should do for TTS, not good for audio-effects - needs -ac 2 for STEREO
    ffmpeg -i $FILE_NAME.wav -vn -ac 1 -aq 5 -ar 22050 -f mp3 $FILE_NAME.mp3
fi

# EXAMPLES ...

# ../bin/gtts.sh -k $API_KEY -p -5 -r 0.9 -i maxaccident.ssml 

# bin/gtts.sh API_KEY tts 'Auf? zur ersten Station! Hier werden wir einen ausgeklügelten Trick der Natur genauer unter die Lupe nehmen: den Lotuseffekt. An diesem Beispiel werden wir uns anschauen, wie wasserabweisende Oberflächen funktionieren und wo in der Natursolche Oberflächen zu finden sind. An dieser Station lernst du, wie es der Lotuspflanze gelingt, sich selbst zu reinigen, welche Vertreter in der Natur diesen Effekt noch nutzen und wie es der Mensch geschafft hat, dieses Prinzip für technische Anwendungen nutzbar zu machen. Viel Spaß bei der ersten Station! Los geht’s!'
