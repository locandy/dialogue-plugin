# dialogue-plugin
 Temporary Project. This JS is useless outside the Locandy Platform

# TODO
  1. Dialogue.js (beta erstellen), DialogueTest.js löschen
  1. GUI
    * Options ID-Selektor
    * (keine horizontale Linie)
    * Text des Agents
    * Portrait, Selektor Image
    * Portrait, Selektor Audio
    * (keine horizontale Linie)
    * Answers
    * + Add Answer
    * horizontale Linie
    * ID-TF, Upload Image with ID
    * .... wie bisher
  1. (Code Kommentieren (alle Variablen besonders transient oder persistent!, komplexe Stellen))
     

# Neue Übersetzungen i18n
  * "Upload image"|i18n:"editor_plugin_dialogue_agent_image_upload"
  * "No file connected"|i18n:"editor_plugin_dialogue_file_not_connected"
  * "File connected"|i18n:"editor_plugin_dialogue_file_connected"
  * 'Text Agent\'|i18n:\'editor_plugin_dialogue_agent_text\'
  * "You\'ve not provided any answers for this dialogue yet."|i18n:"editor_plugin_dialogue_no_answers"
  * 'Answer #%s\'|i18nP:\'editor_plugin_dialogue_label_answer\':($index+1)
  * "No effect connected"|i18n:"editor_plugin_dialogue_effect_not_connected"
  * "Connection corrupted"|i18n:"editor_plugin_dialogue_effect_not_connected_correctly"
  * "Add answer"|i18n:"editor_plugin_dialogue_answer_add"
  * "New dialogue"|i18n:"editor_plugin_dialogue_add"
  * "Import json"|i18n:"editor_plugin_dialogue_json_import"
  * "Copy json to clipboard"|i18n:"editor_plugin_dialogue_json_export"
  *  SHARED multiplechoice:
     * "You\'ve not provided any answers for this plugin yet."|i18n:"editor_plugin_multiplechoice_no_answers"

# Dateien
 * DialogueTest.js -> TestDatei: aktuellste Version von Dialogue
 * Dialogue -> Zwischenstand: akuellste lauffähige Version

# Fragen Thomas
 * Agent-Bilder: 
   * Grundprinzip von Upload und Speicherung richtig?
   * Soll ein Multi-Upload möglich sein? Nein.
   * Bilder werden beim Upload nach kurzer Zeit gemerged. Kann ich das verhindern? Die imageID ist bei dir immer "url", siehe Email von mir.
   * Wie soll der Upload Bereich genau ausschauen? mit Popup-Menü?
   * Soll es eine Möglichkeit geben allen Dialogen das gleiche Bild zuzuweisen? Nein.
 * Audio:
   * Soll es einen Erneut-Abspielen Button geben? Ja.
   * Wie kann ich eine Audio-Datei abspielen? Kann ich dafür in Effect.js nachschauen?
   
         var sound = this.quest.getResource(resourceIdString);

         if(sound)
         {
             locandy.player.plugins.Media.updateCurrentMediaInstance(null);
             sound.play();
         }
         else
             return "ERROR: Missing upload for sound-effect: " + value;


# Yutsi Dialogue Generator
 Here’s a simple Angular UI for generating interactive text-based dialogue that outputs to JSON format: yutsi.com/dialoguegenerator. Check out the repo for instructions as well as an importable JSON sample. This has proven a very useful tool in the development of HTML5 video games, especially when using Phaser.js, which is a wonderful library but can be tedious when dealing with interactive text. http://yutsi.com/2016/08/14/dialogue-generator?da=true

  * Wie unterscheidet sich YUTSI von unserem Design?
  * Sollen wir was übernehmen/verbessern?

# Icons
    unlocked2.svg
    lock5.svg
    share3.svg
    compass2.svg
    compass3.svg
    checkbox-checked2.svg
    checkbox-unchecked3.svg"
    radio-checked.svg
    radio-unchecked.svg
    menu6.svg
    stop2.svg
    pause2.svg
    play4.svg
    enter.svg
    exit.svg
    cog.svg
    pen2.svg
    search3.svg
    user.svg
    home8.svg
    wrench.svg
    medal2.svg
    medal3.svg
    enter3.svg
    user-plus.svg
    user-cancel.svg
    camera3.svg
    direction.svg
    location4.svg
    trophy2.svg
    plus-circle.svg
    minus-circle.svg
    arrow-down5.svg
    arrow-up5.svg
    arrow-right.svg
    arrow-first.svg
    clipboard2.svg
    location3.svg
    disk.svg
    remove8.svg
    info.svg
    info3.svg
    sad.svg
    arrow-left5.svg
    arrow-right6.svg
    checkmark-circle2.svg
    info2.svg
    wand2.svg
    filter.svg
    puzzle3.svg
    tags.svg
    pencil2.svg
    arrow-down2.svg
    arrow-up2.svg
    upload.svg
    undo2.svg
    pencil5.svg
    map3.svg
    tag5.svg
    flag.svg
    star6.svg
    close4.svg
    facebook.svg
    github2.svg
    google.svg
    twitter.svg
    windows.svg
    download7.svg
    upload7.svg
    earth.svg
    briefcase3.svg
    music3.svg
    transmission.svg
    users.svg
    thumbs-up3.svg
    file6.svg
    spinner10.svg
    book.svg
    book2.svg
    atom2.svg
    happy.svg
    loop4.svg
    close2.svg
    quill3.svg
    mobile.svg
    thumbs-up2.svg
    android.svg
    apple.svg
    steps.svg
    envelop.svg
    phone.svg
    checkmark.svg
    close.svg
    clock6.svg
    stopwatch.svg
    calendar2.svg
    file6.svg
    image.svg
    plus.svg
    google-plus.svg
    target3.svg
    arrow-right2.svg
    question2.svg
    music.svg
    plus-circle2.svg
    minus-circle2.svg
    upload3.svg
    blocked.svg
    download3.svg
    notification2.svg
    lightning.svg
    eye.svg
    eye-blocked.svg
    user3.svg
    copy.svg
    images.svg
    expand.svg
    coins.svg
    arrow-left16.svg
    arrow-right17.svg
    volume-high.svg
    file-picture.svg
    qrcode.svg
    arrow-right-up-gps.svg
    share.svg
    mail.svg
    mail4.svg
    mail5.svg
