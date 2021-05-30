// Bakeoff #3 - Escrita em Smartwatches
// IPM 2020-21, Semestre 2
// Entrega: até dia 4 de Junho às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 31 de Maio

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 45;      // add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = false;  // set to 'true' before sharing during the simulation and bake-off days

let PPI, PPCM;                 // pixel density (DO NOT CHANGE!)
let second_attempt_button;     // button that starts the second attempt (DO NOT CHANGE!)

// Finger parameters (DO NOT CHANGE!)
let finger_img;                // holds our finger image that simules the 'fat finger' problem
let FINGER_SIZE, FINGER_OFFSET;// finger size and cursor offsett (calculated after entering fullscreen)

// Arm parameters (DO NOT CHANGE!)
let arm_img;                   // holds our arm/watch image
let ARM_LENGTH, ARM_HEIGHT;    // arm size and position (calculated after entering fullscreen)

// Study control parameters (DO NOT CHANGE!)
let draw_finger_arm  = false;  // used to control what to show in draw()
let phrases          = [];     // contains all 501 phrases that can be asked of the user
let most_common_words  = [];   // contains most used words in english
let current_trial    = 0;      // the current trial out of 2 phrases (indexes into phrases array above)
let attempt          = 0       // the current attempt out of 2 (to account for practice)
let target_phrase    = "";     // the current target phrase
let currently_typed  = "";     // what the user has typed so far
let suggested_word_1   = "";   // recommended word number 1
let suggested_word_2   = "";   // recommended word number 2
let rest1              = "";   // fill the rest of current word when auto-completing
let rest2              = "";
let entered          = new Array(2); // array to store the result of the two trials (i.e., the two phrases entered in one attempt)
let position         = 0;
let CPS              = 0;      // add the characters per second (CPS) here (once for every attempt)

// Metrics
let attempt_start_time, attempt_end_time; // attemps start and end times (includes both trials)
let trial_end_time;            // the timestamp of when the lastest trial was completed
let letters_entered  = 0;      // running number of letters entered (for final WPM computation)
let letters_expected = 0;      // running number of letters expected (from target phrase)
let errors           = 0;      // a running total of the number of errors (when hitting 'ACCEPT')
let database;                  // Firebase DB

// 2D Keyboard UI
let leftArrow, rightArrow, spaceBar, backspace, upArrow, downArrow;     // holds the left and right UI images for our basic 2D keyboard   
let ARROW_SIZE;                // UI button size
let vowels = "aeiou";
let consonants = "bcdfghjklmnpqrstvwxyz";
let indexVowels = 0;
let indexConsonants = 0;
let current_vowel = vowels[indexVowels];
let next_vowel = vowels[indexVowels+1];
let current_consonant = consonants[indexConsonants];
let next_consonant = consonants[indexConsonants+1];

let current_screen = 0;

// Runs once before the setup() and loads our data (images, phrases)
function preload()
{    
  // Loads simulation images (arm, finger) -- DO NOT CHANGE!
  arm = loadImage("data/arm_watch.png");
  fingerOcclusion = loadImage("data/finger.png");
    
  // Loads the target phrases (DO NOT CHANGE!)
  phrases = loadStrings("data/phrases.txt");
  most_common_words = loadStrings("data/newlist.txt");
  
  // Loads UI elements for our basic keyboard
  leftArrow = loadImage("data/left.png");
  rightArrow = loadImage("data/right.png");

  spaceBar = loadImage("data/space-bar-1.png");
  backspace = loadImage("data/backspace.png");
  upArrow = loadImage("data/upArrow.png");
  downArrow = loadImage("data/downArrow.png");

  click = loadSound("sound/click1.wav");
}

// Runs once at the start
function setup()
{
  createCanvas(700, 500);   // window size in px before we go into fullScreen()
  frameRate(60);            // frame rate (DO NOT CHANGE!)
  
  // DO NOT CHANGE THESE!
  shuffle(phrases, true);   // randomize the order of the phrases list (N=501)
  target_phrase = phrases[current_trial];
  
  drawUserIDScreen();       // draws the user input screen (student number and display size)
}

function draw()
{ 
  if(draw_finger_arm)
  {
    background(255);           // clear background
    noCursor();                // hides the cursor to simulate the 'fat finger'
    textPrediction();
    
    drawArmAndWatch();         // draws arm and watch background
    writeTargetAndEntered();   // writes the target and entered phrases above the watch
    drawACCEPT();              // draws the 'ACCEPT' button that submits a phrase and completes a trial
    
    // Draws the non-interactive screen area (4x1cm) -- DO NOT CHANGE SIZE!
    noStroke();
    fill(125);
    rect(width/2 - 2.0*PPCM, height/2 - 2.0*PPCM, 4.0*PPCM, 1.0*PPCM);
    textAlign(CENTER, CENTER); 
    textFont("Arial", 0.4 * PPCM);
    fill(0);
    text(suggested_word_1, width/2 - 2.0*PPCM, height/2 - 2.0*PPCM, 4.0*PPCM, 0.5*PPCM);
    text(suggested_word_2, width/2 - 2.0*PPCM, height/2 - 2.0*PPCM + 0.5*PPCM, 4.0*PPCM, 0.5*PPCM);

    // Draws the touch input area (4x3cm) -- DO NOT CHANGE SIZE!
    stroke(0);
    strokeWeight(4);
    noFill();
    rect(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM);

    draw2Dkeyboard();       // draws our basic 2D keyboard UI

    drawFatFinger();        // draws the finger that simulates the 'fat finger' problem
  }
}

// Draws 2D keyboard UI (current letter and left and right arrows)
function draw2Dkeyboard()
{

  noStroke();
  stroke(0);
  strokeWeight(4);
  line(width/2 - 2*PPCM + (4/3)*PPCM, height/2 - 1*PPCM, width/2 - 2*PPCM + (4/3)*PPCM, height/2 + 2*PPCM - (3/4)*PPCM);
  line(width/2 - 2*PPCM + (8/3)*PPCM, height/2 - 1*PPCM, width/2 - 2*PPCM + (8/3)*PPCM, height/2 + 2*PPCM - (3/4)*PPCM);
  line(width/2, height/2 - 1*PPCM + (9/4)*PPCM, width/2, height/2 + 2*PPCM);
  line(width/2 - 2*PPCM, height/2 - 1*PPCM + (3/4)*PPCM, width/2 + 2*PPCM, height/2 - 1*PPCM + (3/4)*PPCM);
  line(width/2 - 2*PPCM, height/2 - 1*PPCM + (6/4)*PPCM, width/2 + 2*PPCM, height/2 - 1*PPCM + (6/4)*PPCM);
  line(width/2 - 2*PPCM, height/2 - 1*PPCM + (9/4)*PPCM, width/2 + 2*PPCM, height/2 - 1*PPCM + (9/4)*PPCM);
  noStroke();
  // Writes the current letter
  textFont("Arial", 0.4 * PPCM);
  fill(0);
  textAlign(CENTER, CENTER);
  text(" ABC", width/2 - 2*PPCM + (4/3)*PPCM, height/2 - 1*PPCM, (4/3)*PPCM, (3/4)*PPCM);
  text(" DEF", width/2 - 2*PPCM + (8/3)*PPCM, height/2 - 1*PPCM, (4/3)*PPCM, (3/4)*PPCM);
  text(" GHI", width/2 - 2*PPCM, height/2 - 1*PPCM + (3/4)*PPCM, (4/3)*PPCM, (3/4)*PPCM);
  text(" JKL", width/2 - 2*PPCM + (4/3)*PPCM, height/2 - 1*PPCM + (3/4)*PPCM, (4/3)*PPCM, (3/4)*PPCM);
  text(" MNO", width/2 - 2*PPCM + (8/3)*PPCM, height/2 - 1*PPCM + (3/4)*PPCM, (4/3)*PPCM, (3/4)*PPCM);
  text(" PQRS", width/2 - 2*PPCM, height/2 - 1*PPCM + (6/4)*PPCM, (4/3)*PPCM, (3/4)*PPCM);
  text(" TUV", width/2 - 2*PPCM + (4/3)*PPCM, height/2 - 1*PPCM + (6/4)*PPCM, (4/3)*PPCM, (3/4)*PPCM);
  text(" WXYZ", width/2 - 2*PPCM + (8/3)*PPCM, height/2 - 1*PPCM + (6/4)*PPCM, (4/3)*PPCM, (3/4)*PPCM);
  text(" SPACE", width/2 - 2*PPCM, height/2 - 1*PPCM + (9/4)*PPCM, (4/2)*PPCM, (3/4)*PPCM);
  textSize(0.3 * PPCM);
  text(" COMPLETE", width/2, height/2 - 1*PPCM + (9/4)*PPCM, (4/2)*PPCM, (3/4)*PPCM);
  imageMode(CORNER);
  image(backspace, width/2 - 2*PPCM + (4/3)*PPCM*(1/8), height/2 - 1*PPCM + (3/4)*PPCM*(1/8), (4/3)*PPCM*(3/4), (3/4)*PPCM*(3/4));

  if (current_screen != 0)
  {
    fill(146, 219, 215);
    rect(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/10)*PPCM, (96/50)*PPCM);
    fill(255, 98, 98);
    rect(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM + (96/50)*PPCM, (32/10)*PPCM, (39/50)*PPCM);
    fill(0);
    textSize(0.7*PPCM);
    text(" x", width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM + (96/50)*PPCM, (32/10)*PPCM, (39/50)*PPCM);
    stroke(0);
    strokeWeight(2);
    line(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM + (96/50)*PPCM, width/2 - 2*PPCM + (4/10)*PPCM + (32/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM + (96/50)*PPCM);
    if (current_screen != 6 && current_screen != 8 && current_screen != 9)
    {
      line(width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM + (96/50)*PPCM);
      line(width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM + (96/50)*PPCM);
      if (current_screen == 1) {
        noStroke();
        fill(0);
        textSize(0.6*PPCM);
        textAlign(CENTER, CENTER);
        text(" A", width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
        text(" B", width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
        text(" C", width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
      }
      else if (current_screen == 2) {
        noStroke();
        fill(0);
        textSize(0.6*PPCM);
        textAlign(CENTER, CENTER);
        text(" D", width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
        text(" E", width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
        text(" F", width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
      }
      else if (current_screen == 3) {
        noStroke();
        fill(0);
        textSize(0.6*PPCM);
        textAlign(CENTER, CENTER);
        text(" G", width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
        text(" H", width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
        text(" I", width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
      }
      else if (current_screen == 4) {
        noStroke();
        fill(0);
        textSize(0.6*PPCM);
        textAlign(CENTER, CENTER);
        text(" J", width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
        text(" K", width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
        text(" L", width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
      }
      else if (current_screen == 5) {
        noStroke();
        fill(0);
        textSize(0.6*PPCM);
        textAlign(CENTER, CENTER);
        text(" M", width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
        text(" N", width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
        text(" O", width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
      }
      else if (current_screen == 7) {
        noStroke();
        fill(0);
        textSize(0.6*PPCM);
        textAlign(CENTER, CENTER);
        text(" T", width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
        text(" U", width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
        text(" V", width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM);
      }
    }
    else if (current_screen == 9)
    {
      line(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM + (48/50)*PPCM, width/2 - 2*PPCM + (4/10)*PPCM + (32/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM + (48/50)*PPCM);
      noStroke();
      fill(0);
      textSize(0.4*PPCM);
      textAlign(CENTER, CENTER);
      text(suggested_word_1, width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/10)*PPCM, (48/50)*PPCM);
      text(suggested_word_2, width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM + (48/50)*PPCM, (32/10)*PPCM, (48/50)*PPCM);
    }
    else
    {
      line(width/2 - 2*PPCM + (4/10)*PPCM + (32/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, width/2 - 2*PPCM + (4/10)*PPCM + (32/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM + (96/50)*PPCM);
      line(width/2 - 2*PPCM + (4/10)*PPCM + (64/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, width/2 - 2*PPCM + (4/10)*PPCM + (64/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM + (96/50)*PPCM);
      line(width/2 - 2*PPCM + (4/10)*PPCM + (96/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, width/2 - 2*PPCM + (4/10)*PPCM + (96/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM + (96/50)*PPCM);
      if (current_screen == 6) {
        noStroke();
        fill(0);
        textSize(0.6*PPCM);
        textAlign(CENTER, CENTER);
        text(" P", width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM);
        text(" Q", width/2 - 2*PPCM + (4/10)*PPCM + (32/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM);
        text(" R", width/2 - 2*PPCM + (4/10)*PPCM + (64/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM);
        text(" S", width/2 - 2*PPCM + (4/10)*PPCM + (96/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM);
      }
      else if (current_screen == 8) {
        noStroke();
        fill(0);
        textSize(0.6*PPCM);
        textAlign(CENTER, CENTER);
        text(" W", width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM);
        text(" X", width/2 - 2*PPCM + (4/10)*PPCM + (32/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM);
        text(" Y", width/2 - 2*PPCM + (4/10)*PPCM + (64/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM);
        text(" Z", width/2 - 2*PPCM + (4/10)*PPCM + (96/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM);
      }
    }
  }
}

function textPrediction()
{
  let itString = "";
  let n_sug = 0;
  let dif = "";
  
  for(i = 0; i < 99976; i++)
    {
      itString = most_common_words[i];
      for(j = position; j < currently_typed.length; j++)
        {
          if(n_sug == 2) return;
          if(itString[j-position] != currently_typed[j]) break;
          if(j == currently_typed.length-1)
            {
              if(n_sug == 0)
                {
                  suggested_word_1 = itString;
                  dif = subset(currently_typed, position);
                  rest1 = subset(itString, dif.length);
                  n_sug++;
                }
              else if(n_sug == 1)
                {
                  suggested_word_2 = itString;
                  dif = subset(currently_typed, position);
                  rest2 = subset(itString, dif.length);
                  n_sug++;
                }
            }
        }
      
    }
}

function positionWhenDelete()
{
  let it = currently_typed.length-1;
  while(it > 0)
  {
    if (currently_typed[it] == " ")
    {
      position = it+1;
      return;
    }
    it--;
  }
  position = 0;
}

// Evoked when the mouse button was pressed
function mousePressed()
{
  // Only look for mouse presses during the actual test
  if (draw_finger_arm)
  {                   
    // Check if mouse click happened within the touch input area
    if(mouseClickWithin(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM))  
    {
      if (current_screen == 0)
      {
        click.play();
        if (mouseClickWithin(width/2 - 2*PPCM + (4/3)*PPCM, height/2 - 1*PPCM, (4/3)*PPCM, (3/4)*PPCM))
        {
          current_screen = 1;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (8/3)*PPCM, height/2 - 1*PPCM, (4/3)*PPCM, (3/4)*PPCM))
        {
          current_screen = 2;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM, height/2 - 1*PPCM + (3/4)*PPCM, (4/3)*PPCM, (3/4)*PPCM))
        {
          current_screen = 3;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/3)*PPCM, height/2 - 1*PPCM + (3/4)*PPCM, (4/3)*PPCM, (3/4)*PPCM))
        {
          current_screen = 4;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (8/3)*PPCM, height/2 - 1*PPCM + (3/4)*PPCM, (4/3)*PPCM, (3/4)*PPCM))
        {
          current_screen = 5;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM, height/2 - 1*PPCM + (6/4)*PPCM, (4/3)*PPCM, (3/4)*PPCM))
        {
          current_screen = 6;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/3)*PPCM, height/2 - 1*PPCM + (6/4)*PPCM, (4/3)*PPCM, (3/4)*PPCM))
        {
          current_screen = 7;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (8/3)*PPCM, height/2 - 1*PPCM + (6/4)*PPCM, (4/3)*PPCM, (3/4)*PPCM))
        {
          current_screen = 8;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM, height/2 - 1*PPCM + (9/4)*PPCM, (4/2)*PPCM, (3/4)*PPCM))
        {
          currently_typed += " ";
          position = currently_typed.length;
        }
        else if (mouseClickWithin(width/2, height/2 - 1*PPCM + (9/4)*PPCM, (4/2)*PPCM, (3/4)*PPCM))
        {
          current_screen = 9;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM, height/2 - 1*PPCM, (4/3)*PPCM, (3/4)*PPCM))
        {
          currently_typed = currently_typed.substring(0, currently_typed.length - 1);
          positionWhenDelete();
        }
      }
      
      else if (current_screen == 1)
      {
        if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "a";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "b";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "c";
          current_screen = 0;
        }
        else
          current_screen = 0;
      }
      else if (current_screen == 2)
      {
        if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "d";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "e";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "f";
          current_screen = 0;
        }
        else
          current_screen = 0;
      }
      else if (current_screen == 3)
      {
        if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "g";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "h";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "i";
          current_screen = 0;
        }
        else
          current_screen = 0;
      }
      else if (current_screen == 4)
      {
        if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "j";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "k";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "l";
          current_screen = 0;
        }
        else
          current_screen = 0;
      }
      else if (current_screen == 5)
      {
        if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "m";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "n";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "o";
          current_screen = 0;
        }
        else
          current_screen = 0;
      }
      else if (current_screen == 6)
      {
        if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM)) {
          currently_typed += "p";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (32/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM)) {
          currently_typed += "q";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (64/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM)) {
          currently_typed += "r";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (96/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM)) {
          currently_typed += "s";
          current_screen = 0;
        }
        else
          current_screen = 0;
      }
      else if (current_screen == 7)
      {
        if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "t";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (32/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "u";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (64/30)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/30)*PPCM, (96/50)*PPCM)) {
          currently_typed += "v";
          current_screen = 0;
        }
        else
          current_screen = 0;
      }
      else if (current_screen == 8)
      {
        if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM)) {
          currently_typed += "w";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (32/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM)) {
          currently_typed += "x";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (64/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM)) {
          currently_typed += "y";
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM + (96/40)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/40)*PPCM, (96/50)*PPCM)) {
          currently_typed += "z";
          current_screen = 0;
        }
        else
          current_screen = 0;
      }
      else if (current_screen == 9)
      {
        if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM, (32/10)*PPCM, (48/50)*PPCM)) {
          currently_typed += rest1 + " ";
          position = currently_typed.length;
          current_screen = 0;
        }
        else if (mouseClickWithin(width/2 - 2*PPCM + (4/10)*PPCM, height/2 - 1*PPCM + (3/10)*PPCM + (48/50)*PPCM, (32/10)*PPCM, (48/50)*PPCM)) {
          currently_typed += rest2 + " ";
          position = currently_typed.length;
          current_screen = 0;
        }
        else
          current_screen = 0;
      }
    }
    
    // Check if mouse click happened within 'ACCEPT' 
    // (i.e., submits a phrase and completes a trial)
    else if (mouseClickWithin(width/2 - 2*PPCM, height/2 - 5.1*PPCM, 4.0*PPCM, 2.0*PPCM))
    {
      // Saves metrics for the current trial
      letters_expected += target_phrase.trim().length;
      letters_entered += currently_typed.trim().length;
      errors += computeLevenshteinDistance(currently_typed.trim(), target_phrase.trim());
      entered[current_trial] = currently_typed;
      trial_end_time = millis();

      current_trial++;

      // Check if the user has one more trial/phrase to go
      if (current_trial < 2)                                           
      {
        // Prepares for new trial
        currently_typed = "";
        rest1 = "";
        rest2 = "";
        suggested_word_1 = "";
        suggested_word_2 = "";
        position = 0;
        target_phrase = phrases[current_trial];  
      }
      else
      {
        // The user has completed both phrases for one attempt
        draw_finger_arm = false;
        attempt_end_time = millis();
        
        printAndSavePerformance();        // prints the user's results on-screen and sends these to the DB
        attempt++;

        // Check if the user is about to start their second attempt
        if (attempt < 2)
        {
          second_attempt_button = createButton('START 2ND ATTEMPT');
          second_attempt_button.mouseReleased(startSecondAttempt);
          second_attempt_button.position(width/2 - second_attempt_button.size().width/2, height/2 + 200);
        }
      }
    }
  }
}

// Resets variables for second attempt
function startSecondAttempt()
{
  // Re-randomize the trial order (DO NOT CHANG THESE!)
  shuffle(phrases, true);
  current_trial        = 0;
  target_phrase        = phrases[current_trial];
  
  // Resets performance variables (DO NOT CHANG THESE!)
  letters_expected     = 0;
  letters_entered      = 0;
  errors               = 0;
  position             = 0;
  CPS                  = 0;
  currently_typed      = "";
  rest1                = "";
  rest2                = "";
  suggested_word_1     = "";
  suggested_word_2     = "";
  current_letter       = 'a';
  
  // Show the watch and keyboard again
  second_attempt_button.remove();
  draw_finger_arm      = true;
  attempt_start_time   = millis();  
}

// Print and save results at the end of 2 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE
  let attempt_duration = (attempt_end_time - attempt_start_time) / 60000;          // 60K is number of milliseconds in minute
  let wpm              = (letters_entered / 5.0) / attempt_duration;      
  let freebie_errors   = letters_expected * 0.05;                                  // no penalty if errors are under 5% of chars
  let penalty          = max(0, (errors - freebie_errors) / attempt_duration); 
  let wpm_w_penalty    = max((wpm - penalty),0);                                   // minus because higher WPM is better: NET WPM
  let timestamp        = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  
  CPS = letters_entered / ((attempt_end_time - attempt_start_time) / 1000);
  
  background(color(0,0,0));    // clears screen
  cursor();                    // shows the cursor again
  
  textFont("Arial", 16);       // sets the font to Arial size 16
  fill(color(255,255,255));    //set text fill color to white
  text(timestamp, 100, 20);    // display time on screen 
  
  text("Finished attempt " + (attempt + 1) + " out of 2!", width / 2, height / 2); 
  
  // For each trial/phrase
  let h = 20;
  for(i = 0; i < 2; i++, h += 40 ) 
  {
    text("Target phrase " + (i+1) + ": " + phrases[i], width / 2, height / 2 + h);
    text("User typed " + (i+1) + ": " + entered[i], width / 2, height / 2 + h+20);
  }
  
  text("Raw WPM: " + wpm.toFixed(2), width / 2, height / 2 + h+20);
  text("Freebie errors: " + freebie_errors.toFixed(2), width / 2, height / 2 + h+40);
  text("Penalty: " + penalty.toFixed(2), width / 2, height / 2 + h+60);
  text("WPM with penalty: " + wpm_w_penalty.toFixed(2), width / 2, height / 2 + h+80);
  text("CPS: " + CPS.toFixed(2), width / 2, height / 2 + h+160);

  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:         GROUP_NUMBER,
        assessed_by:          student_ID,
        attempt_completed_by: timestamp,
        attempt:              attempt,
        attempt_duration:     attempt_duration,
        raw_wpm:              wpm,      
        freebie_errors:       freebie_errors,
        penalty:              penalty,
        wpm_w_penalty:        wpm_w_penalty,
        cps:                  CPS
  }
  
  // Send data to DB (DO NOT CHANGE!)
  if (BAKE_OFF_DAY)
  {
    // Access the Firebase DB
    if (attempt === 0)
    {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }
    
    // Add user performance results
    let db_ref = database.ref('G' + GROUP_NUMBER);
    db_ref.push(attempt_data);
  }
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized()
{
  resizeCanvas(windowWidth, windowHeight);
  let display    = new Display({ diagonal: display_size }, window.screen);
  
  // DO NO CHANGE THESE!
  PPI           = display.ppi;                        // calculates pixels per inch
  PPCM          = PPI / 2.54;                         // calculates pixels per cm
  FINGER_SIZE   = (int)(11   * PPCM);
  FINGER_OFFSET = (int)(0.8  * PPCM)
  ARM_LENGTH    = (int)(19   * PPCM);
  ARM_HEIGHT    = (int)(11.2 * PPCM);
  
  ARROW_SIZE    = (int)(2.2 * PPCM);
  
  // Starts drawing the watch immediately after we go fullscreen (DO NO CHANGE THIS!)
  draw_finger_arm = true;
  attempt_start_time = millis();
}
