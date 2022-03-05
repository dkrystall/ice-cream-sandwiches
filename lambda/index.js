/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const Util = require('./util.js');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        //const speakOutput = 'oh no, here we go!';
        const audioUrl = Util.getS3PreSignedUrl("Media/icecreamsandwiches.mp3").replace(/&/g,'&amp;');

        return handlerInput.responseBuilder
            .speak(`Oh no, here we go! <audio src="${audioUrl}"/>`)
            .getResponse();
    }
};

const PlayAudioIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayAudioIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ResumeIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Oh no, here we go.';
        const playbackInfo = getPlaybackInfo(handlerInput);
        const playBehavior = 'REPLACE_ALL';
        const songUrl = Util.getS3PreSignedUrl("Media/icecreamsandwiches.mp3").replace(/&/g,'&amp;');
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .addAudioPlayerPlayDirective(
                playBehavior,
                songUrl,
                playbackInfo.token,
                playbackInfo.offsetInMilliseconds
                )
            .getResponse();
    }
}

async function getPlaybackInfo(handlerInput) {
  const attributes = await handlerInput.attributesManager.getPersistentAttributes();
  return attributes.playbackInfo;
}

async function setPlaybackInfo(handlerInput, playbackInfoObject) {
  await handlerInput.attributesManager.setPersistentAttributes({
      playbackInfo: playbackInfoObject
      });
}

const PauseAudioIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.PauseIntent';
    },
    async handle(handlerInput) {
        return handlerInput.responseBuilder
            .addAudioPlayerStopDirective()
            .getResponse();
    }
};


const UnsupportedAudioIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (
                Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.LoopOffIntent'
                    || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.LoopOnIntent'
                    || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NextIntent'
                    || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.PreviousIntent'
                    || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.RepeatIntent'
                    || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ShuffleOffIntent'
                    || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ShuffleOnIntent'
                    || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StartOverIntent'
                );
    },
    async handle(handlerInput) {
        const speakOutput = 'Sorry, I can\'t support that yet.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say "play audio" to start playing music! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const AudioPlayerEventHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type.startsWith('AudioPlayer.');
  },
  async handle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    
    const audioPlayerEventName = handlerInput.requestEnvelope.request.type.split('.')[1];
    console.log(`AudioPlayer event encountered: ${handlerInput.requestEnvelope.request.type}`);
    let returnResponseFlag = false;
    switch (audioPlayerEventName) {
      case 'PlaybackStarted':
        playbackInfo.token = handlerInput.requestEnvelope.request.token;
        playbackInfo.inPlaybackSession = true;
        playbackInfo.hasPreviousPlaybackSession = true;
        returnResponseFlag = true;
        break;
      case 'PlaybackFinished':
        playbackInfo.inPlaybackSession = false;
        playbackInfo.hasPreviousPlaybackSession = false;
        playbackInfo.nextStreamEnqueued = false;
        returnResponseFlag = true;
        break;
      case 'PlaybackStopped':
        playbackInfo.token = handlerInput.requestEnvelope.request.token;
        playbackInfo.inPlaybackSession = true;
        playbackInfo.offsetInMilliseconds = handlerInput.requestEnvelope.request.offsetInMilliseconds;
        break;
      case 'PlaybackNearlyFinished':
        break;
      case 'PlaybackFailed':
        playbackInfo.inPlaybackSession = false;
        console.log('Playback Failed : %j', handlerInput.requestEnvelope.request.error);
        break;
      default:
        break;
    }
    setPlaybackInfo(handlerInput, playbackInfo);
    return handlerInput.responseBuilder.getResponse();
  },
};

const PlaybackControllerHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type.startsWith('PlaybackController.');
  },
  async handle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    const playBehavior = 'REPLACE_ALL';
    const songUrl = Util.getS3PreSignedUrl("Media/icecreamsandwiches.mp3").replace(/&/g,'&amp;');
    const playbackControllerEventName = handlerInput.requestEnvelope.request.type.split('.')[1];
    let response;
    switch (playbackControllerEventName) {
      case 'PlayCommandIssued':
        response = handlerInput.responseBuilder
            .addAudioPlayerPlayDirective(
                playBehavior,
                songUrl,
                playbackInfo.token,
                playbackInfo.offsetInMilliseconds
                )
            .getResponse();
        break;
      case 'PauseCommandIssued':
        response = handlerInput.responseBuilder
            .addAudioPlayerStopDirective()
            .getResponse();
        break;
      default:
        break;
    }
    setPlaybackInfo(handlerInput, playbackInfo);

    console.log(`PlayCommandIssued event encountered: ${handlerInput.requestEnvelope.request.type}`);
    return response;
  },
};

const SystemExceptionHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'System.ExceptionEncountered';
  },
  handle(handlerInput) {
    console.log(`System exception encountered: ${JSON.stringify(handlerInput.requestEnvelope.request)}`);
  },
};

/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayAudioIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try some more.';
        const playbackInfo = getPlaybackInfo(handlerInput);
        const playBehavior = 'REPLACE_ALL';
        const songUrl = Util.getS3PreSignedUrl("Media/icecreamsandwiches.mp3").replace(/&/g,'&amp;');
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt(speakOutput)
            .addAudioPlayerPlayDirective(
                playBehavior,
                songUrl,
                playbackInfo.token,
                playbackInfo.offsetInMilliseconds
                )
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        PlayAudioIntentHandler,
        PauseAudioIntentHandler,
        UnsupportedAudioIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        AudioPlayerEventHandler,
        PlaybackControllerHandler,
        SystemExceptionHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();