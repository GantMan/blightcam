;(() => {
  const DETECTION_INTERVAL_MILLIS = 1000

  const video = document.querySelector('video')
  const pages = document.querySelectorAll('.page')
  const supportedDiv = document.getElementById('supported')
  const unsupportedDiv = document.getElementById('unsupported')
  const errorMsg = document.getElementById('error-msg')
  const audio = new Audio('audio/intruder.mp3')

  const personStuff = [
    'jean, blue jean, denim',
    'jersey, T-shirt, tee shirt',
    'sweatshirt',
    'trench coat',
    'ski mask',
    'suit, suit of clothes',
    'cloak',
    'cardigan',
    'bow tie, bow-tie, bowtie',
    'bikini, two-piece'
  ]
  const carStuff = [
    'passenger car, coach, carriage',
    'racer, race car, racing car',
    'tow truck, tow car, wrecker',
    'trailer truck, tractor trailer, trucking rig, rig, articulated ' +
      'lorry, semi',
    'beach wagon, station wagon, wagon, estate car, beach waggon, station ' +
      'waggon, waggon',
    'pickup, pickup truck'
  ]
  let predictionModel = null

  async function detectBlightFolks() {
    try {
      const predictions = await predictionModel.classify(video)

      const topResult = predictions[0]
      // console.log(topResult.className)

      if (personStuff.includes(topResult.className)) {
        document.body.classList.add('intruder')
        audio.play()
      } else if (carStuff.includes(topResult.className)) {
        document.body.classList.add('vehicle')
        document.body.classList.remove('intruder')
      } else {
        document.body.classList.remove('intruder', 'vehicle')
      }

      setTimeout(detectBlightFolks, DETECTION_INTERVAL_MILLIS)
    } catch (err) {
      console.error('classify error', err)
      showUnsupported(err)
    }
  }

  function startDetection() {
    document.body.classList.add('detecting')
    detectBlightFolks()
  }

  async function setupCamera() {
    const maxWidth = window.innerWidth
    const maxHeight = window.innerHeight

    const constraints = {
      width: { ideal: maxWidth, max: maxWidth },
      height: { ideal: maxHeight, max: maxHeight },
      facingMode: 'environment' // Rear-facing camera if available
    }

    video.width = maxWidth
    video.height = maxHeight

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: constraints
      })

      const videoTracks = stream.getVideoTracks()

      stream.oninactive = function() {
        console.log('Stream inactive')
      }

      if ('srcObject' in video) {
        video.srcObject = stream
      } else {
        video.src = window.URL.createObjectURL(stream)
      }

      try {
        predictionModel = await mobilenet.load()
        startDetection()
      } catch (err) {
        console.error('Tensorflow error', err)
        showUnsupported(err)
      }
    } catch (err) {
      console.error('getUserMedia error', err)
      showUnsupported(err)
    }
  }

  function showSupported() {
    showPage('intro')
    supportedDiv.style.display = 'block'
    unsupportedDiv.style.display = 'none'
  }

  function showUnsupported(error) {
    errorMsg.innerHTML = error
    showPage('intro')
    unsupportedDiv.style.display = 'block'
    supportedDiv.style.display = 'none'
  }

  function showPage(pageName) {
    pages.forEach(page => {
      page.classList.add('hidden')
    })
    const pageEl = document.getElementById(`page-${pageName}`)
    pageEl.classList.remove('hidden')
  }

  function init() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showUnsupported()
      return
    }

    const btnGo = document.getElementById('btn-go')

    btnGo.addEventListener('click', () => {
      setupCamera()
      showPage('detector')
    })

    showSupported()

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('service-worker.js')
        .then(() => {
          console.log('Service worker successfully registered')
        })
        .catch(err => {
          console.error('Service worker failed to register', err)
        })
    } else {
      console.log('Service workers not supported')
    }
  }

  init()
})()
