import logo from './logo.svg';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Select from 'react-select'
import React, { useState, useEffect, version } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col'
import "./App.css"
import { ImArrowUp, ImArrowDown } from "react-icons/im";
import { FaBimobject, FaHeart } from "react-icons/fa";
import { GiCompactDisc, GiCrackedDisc } from "react-icons/gi";


// given a duration in mm:ss string format, converts it to the total number of seconds 
function convertDurationToSeconds(durationString) {
  // split time into minutes and seconds
  var parts = durationString.split(":")
  var minutes = parseInt(parts[0], 10)
  var seconds = parseInt(parts[1], 10)

  // return total num of seconds
  return minutes * 60 + seconds
}

// given a number of seconds, converts to a string representing duration in hh:mm:ss format
function convertSecondsToDuration(seconds) {
  var hours = Math.floor(seconds / 3600)
  var leftoverSeconds = seconds - hours * 3600
  var minutes = Math.floor(leftoverSeconds / 60)
  var seconds = leftoverSeconds - minutes * 60

  var minuteString = (minutes < 10) ? `0${minutes}` : `${minutes}`
  var secondString = (seconds < 10) ? `0${seconds}` : `${seconds}`

  if (hours) {
    return `${hours}:` + minuteString + ":" + secondString 
  }
  return minuteString + ":" + secondString
}

function convertListToString(list) {
  let str = ""

  list.forEach((element) => {
    str += element + ", "
  })

  return str.substring(0, str.length - 2)
}

// given two arrays of strings, checks how many shared elements there are and returns an int 
// -1: disjoint arrays
// 1: arrays have the exact same elements
// 0: nonidentical arrays, but there is at least one shared element 
function checkSharedElements(arr1, arr2) {
  // first check if arrays have the exact same elements
  if (arr1.sort().join(',') === arr2.sort().join(',')) {
      return 1
  }

  // check if there is at least one element in common in both arrays
  for (let i = 0; i < arr1.length; i++) {
      for (let j = 0; j < arr2.length; j++) {
          if (arr1[i] === arr2[j]) {
              return 0
          }
      }
  }

  // otherwise, the arrays are disjoint
  return -1
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function App() {
  const [input, setInput] = useState("")
  const [guess, setGuess] = useState("")
  const [guessSelected, setGuessSelected] = useState(false)
  const [results, setResults] = useState([])
  const [guessedAlbums, setGuessedAlbums] = useState([])
  const [lives, setLives] = useState([true, true, true, true, true, true, true, true, true, true])
  const [lostLives, setLostLives] = useState([])
  const [playerWon, setPlayerWon] = useState(false)
  const [displayTitles, setDisplayTitles] = useState(true)
  const [storedAlbum, setStoredAlbum] = useState(null)
  const [displayErrorMsg, setDisplayErrorMsg] = useState(false)
  const [errorMessage, setErrorMessage] = useState("Something went wrong. Please wait a second before trying again.")
  const [loadingGuess, setLoadingGuess] = useState(false)

  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  const [displayGuide, setDisplayGuide] = useState(true)

  const [hintsEnabled, setHintsEnabled] = useState([false, false, false, false, false, false])

  const [hintTheme, setHintTheme] = useState("")
  const [hintTrivia, setHintTrivia] = useState("")
  const [hintHistory, setHintHistory] = useState("")
  const [hintSong, setHintSong] = useState("")

  const [displayHintTheme, setDisplayHintTheme] = useState(false)
  const [displayHintTrivia, setDisplayHintTrivia] = useState(false)
  const [displayHintHistory, setDisplayHintHistory] = useState(false)
  const [displayHintGenre, setDisplayHintGenre] = useState(false)
  const [displayHintYear, setDisplayHintYear] = useState(false)
  const [displayHintSong, setDisplayHintSong] = useState(false)

  const [pointsToday, setPointsToday] = useState(10)
  const [pointsTotal, setPointsTotal] = useState(0)

  useEffect(() => {
    // check if today's date matches localStorage date
    if (localStorage.getItem("today") !== null) {

      // decode date
      let storedDate = new Date(localStorage.getItem("today"))
      let storedDay = storedDate.getDate()
      let storedMonth = storedDate.getMonth()
      let storedYear = storedDate.getFullYear()

      console.log("localStorage date: ", storedDate)
      
      const todayDate = new Date()
      console.log("Today's date: ", todayDate)

      // if today is a new day, check streak and clear previous day's stored data
      if (todayDate.getDate() != storedDay || todayDate.getMonth() != storedMonth || todayDate.getFullYear() != storedYear) {
        // streak check: if player had a previous streak but did not play yesterday, reset their streak
        let prevStreak = localStorage.getItem("currStreak")
        if (prevStreak !== null && prevStreak > 0) {
          // get yesterday's date
          let yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)

          // if localStorage date does not match yesterday's date, player did not play yesterday, so reset their streak
          if (storedDay != yesterday.getDate()) {
            localStorage.setItem("currStreak", 0)
            setCurrentStreak(0)
          }
        }

        // clear everything but streak data
        localStorage.removeItem("albumGuesses")
        localStorage.removeItem("lives")
        localStorage.removeItem("lostLives")
        localStorage.removeItem("won")
        localStorage.removeItem("storedAlbum")
        localStorage.removeItem("todayPoints")

        // set today's date in storage
        const today = new Date()
        localStorage.setItem("today", today.toJSON())
      }
    }
    else {
      // set today's date in storage
      const today = new Date()
      localStorage.setItem("today", today.toJSON())
    }

    // initalize state variables if player has played today's game already

    // try to retrieve stored album guesses (parse from string)
    let albumGuessesJSON = localStorage.getItem("albumGuesses")

    if (albumGuessesJSON !== null) {
      // localStorage stores string, so parse and convert string to array
      let albumArray = JSON.parse(albumGuessesJSON); 

      if (albumArray.length > 0) {
        setGuessedAlbums(albumArray)
      }
    }
    if (localStorage.getItem("lives") !== null) {
      // localStorage stores string, so parse and convert string to array
      let lifeArray = JSON.parse("[" + localStorage.getItem("lives") + "]"); 
      setLives(lifeArray)
    }
    if (localStorage.getItem("lostLives") !== null) {
      // localStorage stores string, so parse and convert string to array
      let lostLifeArray = JSON.parse("[" + localStorage.getItem("lostLives") + "]"); 
      setLostLives(lostLifeArray)
    }
    if (localStorage.getItem("won") !== null) {
      setPlayerWon(localStorage.getItem("won"))
    }
    if (localStorage.getItem("currStreak") !== null) {
      setCurrentStreak(localStorage.getItem("currStreak"))
    }
    if (localStorage.getItem("bestStreak") !== null) {
      setBestStreak(localStorage.getItem("bestStreak"))
    }
    if (localStorage.getItem("todayPoints") !== null) {
      setPointsToday(parseInt(localStorage.getItem("todayPoints")))
    }
    if (localStorage.getItem("totalPoints") !== null) {
      setPointsTotal(parseInt(localStorage.getItem("totalPoints")))
    }
    // retrieve whether any hints are displayed
    let storedHintTheme = localStorage.getItem("displayHintTheme") 
    let storedHintTrivia = localStorage.getItem("displayHintTrivia") 
    let storedHintHistory = localStorage.getItem("displayHintHistory") 
    let storedHintGenre = localStorage.getItem("displayHintGenre") 
    let storedHintYear = localStorage.getItem("displayHintYear") 
    let storedHintSong = localStorage.getItem("displayHintSong") 
    if (storedHintTheme !== null) {
      setDisplayHintTheme(storedHintTheme)
    }
    if (storedHintTrivia !== null) {
      setDisplayHintTrivia(storedHintTrivia)
    }
    if (storedHintHistory !== null) {
      setDisplayHintHistory(storedHintHistory)
    }
    if (storedHintGenre !== null) {
      setDisplayHintGenre(storedHintGenre)
    }
    if (storedHintYear !== null) {
      setDisplayHintYear(storedHintYear)
    }
    if (storedHintSong !== null) {
      setDisplayHintSong(storedHintSong)
    }


    // if user has already retrieved album of the day, no need to retrieve it again
    if (localStorage.getItem("storedAlbum") !== null) {
      let storedAlbumJSON = JSON.parse(localStorage.getItem("storedAlbum"))
      setStoredAlbum(storedAlbumJSON)
    }
    else {
      // retrieve and set album of the day
      getAlbumOfTheDay()
    }
  }, [])

  const fetchData = (value) => {
    let searchDetails = value

    let searchQuery = "https://api.discogs.com/database/search?query=" + searchDetails + "&format=album&type=master&per_page=20&key=uGkUIEFAOmGkpHrAxnqu&secret=GlZQbOWzQGxlcggKTNJwNhAXmaqvbTTk"

    fetch(searchQuery)
      .then((response) => response.json())
      .then((json) => {
        let searchResults = json.results

        setResults(searchResults.sort((a, b) => (b.community.have + b.community.want) - (a.community.have + a.community.want)))
      })
  }

  function compareAlbums(album) {
    return (
      album.title == storedAlbum.title &&
      checkSharedElements(album.artists, storedAlbum.artists) == 1 &&
      checkSharedElements(album.genres, storedAlbum.genres) == 1 &&
      checkSharedElements(album.styles, storedAlbum.styles) == 1 &&
      album.year == storedAlbum.year &&
      album.track_count == storedAlbum.track_count &&
      album.runtime == storedAlbum.runtime 
    )
  }

  function saveNewAlbum(albumDetails, cover_art) {
    try {
      let albumId = albumDetails.id
      let fullAlbum = albumDetails.album
      let album_runtime = albumDetails.runtime
      let track_count = albumDetails.track_count
      let year = albumDetails.year

      // go through all artists and save each to a list
      let artistList = []
      for (let artist in fullAlbum.artists) {
        artistList.push(fullAlbum.artists[artist].name)
      }

      // create new album object combining specified info about album
      const newAlbum = {
        id: albumId,
        title: fullAlbum.title,
        artists: artistList,
        genres: fullAlbum.genres,
        styles: fullAlbum.styles,
        year: year, 
        image: cover_art,
        track_count: track_count, 
        runtime: album_runtime,
      }

      // store guessed albums
      localStorage.setItem("albumGuesses", JSON.stringify([newAlbum, ...guessedAlbums]))

      // done loading album
      setLoadingGuess(false)

      // update guessed albums
      setGuessedAlbums([newAlbum, ...guessedAlbums])

      // clear search input
      setInput("")
      setGuess("")

      // clear error message
      setDisplayErrorMsg(false)      

      // check if album matches stored album
      if (compareAlbums(newAlbum)) {
        // increment points
        let newPoints = pointsToday + 1
        localStorage.setItem("todayPoints", newPoints)
        setPointsToday(newPoints)

        // update total aggregate points by today's total
        let newTotalPoints = pointsTotal + newPoints
        localStorage.setItem("totalPoints", newTotalPoints)
        setPointsTotal(newTotalPoints) 

        // mark that player has won
        setPlayerWon(true)
        localStorage.setItem("won", true)

        // increment streak 
        let newStreak = parseInt(currentStreak) + 1
        localStorage.setItem("currStreak", newStreak)
        setCurrentStreak(newStreak)

        // if current streak surpasses best stored streak, set new best streak
        if (newStreak > bestStreak) {
          setBestStreak(newStreak)
          localStorage.setItem("bestStreak", newStreak)
        }
      }
      else {
        // otherwise, subtract life count
        lives.pop()
        // increase lost life count
        lostLives.push(true)

        localStorage.setItem("lives", lives)
        localStorage.setItem("lostLives", lostLives)

        // if player loses, reset their streak
        if (lives.length == 0) {
          setCurrentStreak(0)
          localStorage.setItem("currStreak", 0)
        }
      }
    }
    catch (error) {
      console.log("Error trying to save new album: ", error)
      setDisplayErrorMsg(true)
      setLoadingGuess(false)
    }

  }

  async function getAlbumOfTheDay() {
    const aotdQueryResponse = await fetch ("https://guessthealbum-222760924592.us-central1.run.app/albumoftheday")
      .then((response) => response.json())
      .then((aotdResponse) => {
        // get returned album id
        
        let master_id = aotdResponse[0].album_id
        console.log(aotdResponse)
        
        // retrieve album from Discogs
        getAlbumById(master_id).then((albumResponse) => {
          let returnedAlbum = albumResponse.album

          // go through all artists and save each to a list
          let artistList = []
          for (let artist in returnedAlbum.artists) {
            artistList.push(returnedAlbum.artists[artist].name)
          }

          fetch(returnedAlbum.main_release_url)
            .then((response) => response.json())
            .then((mainReleaseResponse) => {
              // get main album cover
              let album_cover = mainReleaseResponse.images[0].uri

              const albumOfTheDay = {
                title: returnedAlbum.title,
                artists: artistList,
                genres: returnedAlbum.genres,
                styles: returnedAlbum.styles,
                year: albumResponse.year, 
                cover_image: album_cover,
                track_count: albumResponse.track_count, 
                runtime: albumResponse.runtime
              }

              // store album of the day
              setStoredAlbum(albumOfTheDay)

              // save album to localStorage
              localStorage.setItem("storedAlbum", JSON.stringify(albumOfTheDay))
            }).catch((error) => {
              console.log("Error retrieving album cover: ", error)
            })
        }).catch((error) => {
          console.log("Error retrieving album of the day: ", error)
        })
      })
  }

  async function getAlbumVersion(albumVersionQuery, foundRuntimeParam, foundYearParam) {
    let albumVersion = null
    let foundRuntime = foundRuntimeParam
    let foundYear = foundYearParam
    let album_runtime = 0
    let track_count = 0
    let year = 0 

    await fetch (albumVersionQuery)
      .then ((response) => response.json())
      .then ((newAlbumResponse) => {
          albumVersion = newAlbumResponse


          if (!foundRuntime) {
            let new_track_count = 0
            let new_runtime = 0  

            // count number of tracks of album
            for (let track in newAlbumResponse.tracklist) {
              // if track is a heading, ignore it
              if (newAlbumResponse.tracklist[track].type_ != 'heading') {
                // increment number of tracks
                new_track_count += 1

                // convert duration of track to # of seconds
                let seconds = convertDurationToSeconds(newAlbumResponse.tracklist[track].duration)

                // increment runtime of album by length of current track
                new_runtime += seconds
              }
            }

            // check if runtime was counted
            if (!isNaN(new_runtime) && new_runtime > 0) {
              track_count = new_track_count
              album_runtime = new_runtime

              foundRuntime = true
            }            
          }

          // check if album has year info
          if (!foundYear) {
            if (!isNaN(newAlbumResponse.year) && newAlbumResponse.year > 0) {
              year = newAlbumResponse.year
              foundYear = true
            }
          }
      })  
      .catch((error) => {
        console.log("Error retrieving album version: ", error)
        setDisplayErrorMsg(true)
        setLoadingGuess(false)
      })
      

    return new Promise((resolve, reject) => {
      resolve(
        {
          albumVersion: albumVersion,
          runtime: album_runtime, 
          track_count: track_count,
          year: year,
          foundRuntime: foundRuntime,
          foundYear: foundYear
        }
      )
    })
  }

  async function getAlbumById(master_id) {
    // get full album info
    let albumQuery = "https://api.discogs.com/masters/" + master_id 
  
    let fullAlbum
    let track_count = 0
    let album_runtime = 0
    let versionUrl = ""
    let foundRuntime = false
    let foundYear = false

    const albumQueryResponse = await fetch (albumQuery)
      .then((response) => response.json())
      .then((albumResponse) => {
        fullAlbum = albumResponse

        // save number of tracks of album
        for (let track in fullAlbum.tracklist) {
          // if track is a heading, ignore it
          if (fullAlbum.tracklist[track].type_ != "heading") {
            // increment number of tracks
            track_count += 1

            // convert duration of track to # of seconds
            let seconds = convertDurationToSeconds(fullAlbum.tracklist[track].duration)

            // increment runtime of album by length of current track
            album_runtime += seconds
          }
        }

        if (!isNaN(album_runtime) && album_runtime > 0) {
          foundRuntime = true
        }
      
        // in case we did not get a runtime, get the versions_url of this album to search for a release that has one
        versionUrl = fullAlbum.versions_url
    })
    .catch((error) => {
      console.log("Error retrieving album by id: ", error)
      setDisplayErrorMsg(true)
      setLoadingGuess(false)
    })

    if (fullAlbum.year != null && fullAlbum.year > 0 && !isNaN(fullAlbum.year)) {
      foundYear = true
    }

    let albumWithRuntime = null
    let year = fullAlbum.year

    // send request with versions_url and store the "versions" list attribute from the response
    if (!foundRuntime || !foundYear) {
      let sortedVersionUrl = versionUrl + "?sort=released"
      const versionRequest = await fetch (sortedVersionUrl)
      const versionResponse = await versionRequest.json()

      let albumsSearched = 0
      let maxAlbumsSearched = 10

      // iterate through each of the first versions:
      while ((!foundRuntime || !foundYear) && albumsSearched < maxAlbumsSearched) {
        // get release id of the version
        let versionId = versionResponse.versions[albumsSearched].id

        // send request to get album based on id
        let albumVersionQuery = "https://api.discogs.com/releases/" + versionId
        
        await getAlbumVersion(albumVersionQuery, foundRuntime, foundYear)
          .then((newAlbumDetails) => {
            // fullAlbum = newAlbumDetails.albumVersion 

            if (!foundRuntime) {
              album_runtime = newAlbumDetails.runtime
              track_count = newAlbumDetails.track_count
              foundRuntime = newAlbumDetails.foundRuntime
            }

            if (!foundYear) {
              year = newAlbumDetails.year
              foundYear = newAlbumDetails.foundYear
            }
            
            // 4f) stop iterating once a set number of albums have been iterated through or we've found an album that completes our information
            // if (albumsSearched == maxAlbumsSearched || (foundRuntime && foundYear)) {
            //   break
            // }
          }).catch((error) => {
            console.log("Error retrieving additional album versions: ", error)
            setDisplayErrorMsg(true)
            setLoadingGuess(false)
          })

          albumsSearched += 1
      }

      // if we couldn't find an album with runtime, set runtime to 0
      if (!foundRuntime) {
        album_runtime = 0
      }

      return new Promise((resolve, reject) => {
        resolve(
          {
            id: master_id, 
            album: fullAlbum, 
            runtime: album_runtime, 
            track_count: track_count,
            year: year
          }
        )
      })
    }
    else {
      return new Promise((resolve, reject) => {
        resolve(
          {
            id: master_id, 
            album: fullAlbum, 
            runtime: album_runtime, 
            track_count: track_count,
            year: year
          }
        )
      })
    }
  }


  async function newGuess(album) {
    if (album == null) {
      setDisplayErrorMsg(true)
      setLoadingGuess(false)
      setErrorMessage("Select an album from the results before guessing.")
    }

    try {
      // mark that we are in the process of submitting a new guess
      setLoadingGuess(true)

      // if album has already been submitted for a guess, do nothing
      for (let guessedAlbum in guessedAlbums) {
        if (guessedAlbums[guessedAlbum].id == album.master_id) {
          return
        } 
      }

      // save album cover art
      let cover_art = album.cover_image

      getAlbumById(album.master_id).then((returnedAlbum) => {
        saveNewAlbum(returnedAlbum, cover_art)
      }).catch(error => {
        console.log(error)
        setDisplayErrorMsg(true)
        setLoadingGuess(false)
      })
    }
    catch (error) {
      console.log("Error during album guess: ", error)
      setDisplayErrorMsg(true)
      setLoadingGuess(false)
    }

  }

  const handleChange = (value) => {
    // clear error message, reset to default msg
    setDisplayErrorMsg(false)
    setErrorMessage("Something went wrong. Please wait a second before trying again.")
    setGuess(value)
    setInput(value)
    fetchData(value)
    setGuessSelected(false)
  }

  const handleNewSubmit = (value) => {
    setGuess(value)
    setInput(value.title)
    setGuessSelected(true)
  }

  const updateHintsEnabled = (value) => {
    let pointDecrement = 0
    
    if (value == 0) {
      setDisplayHintTheme(true)
      localStorage.setItem("displayHintTheme", true)
    }
    else if (value == 1) {
      setDisplayHintTrivia(true)
      pointDecrement = 1
      localStorage.setItem("displayHintTrivia", true)
    }
    else if (value == 2) {
      setDisplayHintHistory(true)
      pointDecrement = 2
      localStorage.setItem("displayHintHistory", true)
    }
    else if (value == 3) {
      setDisplayHintGenre(true)
      pointDecrement = 3
      localStorage.setItem("displayHintGenre", true)
    }
    else if (value == 4) {
      setDisplayHintYear(true)
      pointDecrement = 3
      localStorage.setItem("displayHintYear", true)
    }
    else if (value == 5) {
      setDisplayHintSong(true)
      pointDecrement = 5
      localStorage.setItem("displayHintSong", true)
    }

    let new_points = pointsToday - pointDecrement
    setPointsToday(new_points)
    localStorage.setItem("todayPoints", new_points)

    let currentHints = hintsEnabled
    currentHints[value] = true
    setHintsEnabled(currentHints)

    

    // disable hint button
    let hintId = "hint" + value
    const hintButton = document.getElementById(hintId)
    hintButton.setAttribute("disabled", "")
    hintButton.classList.add("bg-success")
    hintButton.style.color = "white"
  }

  return (
    <div className="container main-background">
      <div className="container page-title">
        <p>Guess The Album</p>
      </div>

      {/* If the storedAlbum hasn't been loaded yet, indicate we are still loading */}
      {storedAlbum == null &&
      <div className="d-flex justify-content-center">
        <div className="spinner-border page-loading-spinner" role="status">
          <span className="sr-only"></span>
        </div>
      </div>
      }

      {storedAlbum != null &&
      <div>
        {/* Display tutorial on how to use clues */}
        {(!playerWon && lives.length > 0 && displayGuide) && 
          <div className="container tutorial-box">
            <div className="tutorial-heading">(Sub)genre Clues</div>
            <div className="d-flex flex-row text-center justify-content-center align-items-center">
              <div className="col-sm"><span style={{color: "green", fontWeight: "bold"}}>Green</span>: All (sub)genres match.</div>
              <div className="col-sm"><span style={{color: "#fcd512", fontWeight: "bold"}}>Yellow</span>: At least one of the (sub)genres matches, but not all of them do.</div>
              <div className="col-sm"><span style={{color: "red", fontWeight: "bold"}}>Red</span>: None of the (sub)genres match.</div>
            </div>
            <div className="tutorial-heading">Number Clues</div>
            <div className="d-flex flex-row text-center justify-content-center align-items-center">
              <div className="col-sm"><ImArrowUp/> <span style={{fontWeight: "bold"}}>Arrow up</span>: The actual number/year is LARGER/MORE RECENT than your guess.</div>
              <div className="col-sm"><ImArrowDown/> <span style={{fontWeight: "bold"}}>Arrow down</span>: The actual number/year is SMALLER/LESS RECENT than your guess.</div>
            </div>
          </div>
        }

        {/* Display win message */}
        {(playerWon || localStorage.getItem("won")) &&
          <div className="container win-message">
            {/* Display different messages based on points */}
            {(!displayHintTheme && pointsToday == 11) &&
            <span>
              <p>What!? You didn't even look at the theme!?</p>
              <div>An album god!</div>
            </span>
            }
            {(displayHintTheme && pointsToday == 11) &&
              <p>Turn it up to 11!</p>
            }
            {pointsToday == 10 &&
              <p>A perfect 10!</p>
            }
            {(pointsToday < 10 && pointsToday > 7) &&
              <p>Great work!</p>
            }
            {(pointsToday < 8 && pointsToday > 4) &&
              <p>Good job!</p>
            }
            {(pointsToday < 5 && pointsToday > 1) &&
              <p>Could be worse!</p>
            }
            {(pointsToday == 1) &&
              <p>Just barely got it!</p>
            }
          </div>
        }

        

        {/* Display loss message */}
        {(!playerWon && lives.length == 0) &&
          <div className="container loss-message">
            <p>Better luck next time!</p>
          </div>
        }

        {(playerWon || lives.length == 0) &&
          <div className="end-message">
            {/* Display the actual album of the day */}
            <div>
              <img src={storedAlbum.cover_image} style={{width:"30%", height: "30%"}}/>
            </div>
            <p>{storedAlbum.title} by {convertListToString(storedAlbum.artists)}</p>
          </div>
        }

        {/* Display streak once game has ended */}
        {(playerWon || lives.length == 0) &&
          <div className="d-flex flex-row summary-row">
            <div className="col-sm streak-box">
              {currentStreak > 0 && <p className="streak-text">Current Streak: {currentStreak}</p>}
              <p className="streak-text">Best Streak: {bestStreak}</p>
            </div>
            {/* Display point totals */}
            <div className="col-sm point-display streak-text">
              <p>Today's Points: {pointsToday}</p>
              <p>Total Points: {pointsTotal}</p>
            </div>
          </div>
        }
        
        {(!playerWon && lives.length > 0) &&
        <div className="container hint-box">
          <div className="d-flex flex-row hint-heading">
            <div className="col-2">Help?</div>
            <div className="col">Hints</div>
            <div className="col-2">Points: {pointsToday}</div>
          </div>
          <div className="d-flex flex-row text-center border-bottom">
            <div className="col-1">Cost</div>
            <div className="col-2">Category</div>
            <div className="col-8">Clue</div>
          </div>
          <div className="d-flex flex-row text-center hint-row align-items-center">
            <div className="col-1">- 0</div>
            <div className="col-2">
              {!displayHintTheme &&
                <Button variant="outline-success" className="hint-button" id="hint0" onClick={(e) => updateHintsEnabled(0)}>Theme</Button>
              }
              {displayHintTheme &&
                <Button variant="success" className="hint-button" disabled>Theme</Button>
              }
            </div>
            <div className="col-8">
              {!displayHintTheme &&
                <span>???</span>
              }
              {displayHintTheme &&
                <span>{hintTheme}</span>
              }
            </div>
          </div>
          <div className="d-flex flex-row text-center hint-row">
            <div className="col-1">- 1</div>
            <div className="col-2">
              {(pointsToday >= 1 && !displayHintTrivia) &&
                <Button variant="outline-success" className="hint-button" id="hint1" onClick={(e) => updateHintsEnabled(1)}>Trivia</Button>
              }
              {displayHintTrivia &&
                <Button variant="success" className="hint-button" disabled>Trivia</Button>
              }
              {(pointsToday < 1 && !displayHintTrivia) &&
                <Button variant="danger" className="hint-button" disabled>Trivia</Button>
              }
            </div>
            <div className="col-8">
              {!displayHintTrivia &&
                <span>???</span>
              }
              {displayHintTrivia &&
                <span>{hintTrivia}</span>
              }
            </div>
          </div>
          <div className="d-flex flex-row text-center hint-row">
            <div className="col-1">- 2</div>
            <div className="col-2">
              {(pointsToday >= 2 && !displayHintHistory) &&
                <Button variant="outline-success" className="hint-button" id="hint2" onClick={(e) => updateHintsEnabled(2)}>History/Legacy</Button>
              }
              {displayHintHistory &&
                <Button variant="success" className="hint-button" disabled>History/Legacy</Button>
              }
              {(pointsToday < 2 && !displayHintHistory) &&
                <Button variant="danger" className="hint-button" disabled>History/Legacy</Button>
              }
            </div>
            <div className="col-8">
              {!displayHintHistory &&
                <span>???</span>
              }
              {displayHintHistory &&
                <span>{hintHistory}</span>
              }
            </div>
          </div>
          <div className="d-flex flex-row text-center hint-row">
            <div className="col-1">- 3</div>
            <div className="col-2">
              {(pointsToday >= 3 && !displayHintGenre) &&
                <Button variant="outline-success" className="hint-button" id="hint3" onClick={(e) => updateHintsEnabled(3)}>Reveal Genres</Button>
              }
              {displayHintGenre &&
                <Button variant="success" className="hint-button" disabled>Reveal Genres</Button>
              }
              {(pointsToday < 3 && !displayHintGenre) &&
                <Button variant="danger" className="hint-button" disabled>Reveal Genres</Button>
              }
            </div>
            <div className="col-8">
              {!displayHintGenre &&
                <span>???</span>
              }
              {displayHintGenre &&
                <span>
                  <span className="hint-genre-main">{convertListToString(storedAlbum.genres)}, </span>
                  <span>{convertListToString(storedAlbum.styles)}</span>
                </span>
              }
            </div>
          </div>
          <div className="d-flex flex-row text-center hint-row">
            <div className="col-1">- 3</div>
            <div className="col-2">
              {(pointsToday >= 3 && !displayHintYear) &&
                <Button variant="outline-success" className="hint-button" id="hint4" onClick={(e) => updateHintsEnabled(4)}>Reveal Year</Button>
              }
              {displayHintYear &&
                <Button variant="success" className="hint-button" disabled>Reveal Year</Button>
              }
              {(pointsToday < 3 && !displayHintYear) &&
                <Button variant="danger" className="hint-button" disabled>Reveal Year</Button>
              }
            </div>
            <div className="col-8">
              {!displayHintYear &&
                <span>???</span>
              }
              {displayHintYear &&
                <span>{storedAlbum.year}</span>
              }
            </div>
          </div>
          <div className="d-flex flex-row text-center hint-row">
            <div className="col-1">- 5</div>
            <div className="col-2">
              {(pointsToday >= 5 && !displayHintSong) &&
                <Button variant="outline-success" className="hint-button" id="hint5" onClick={(e) => updateHintsEnabled(5)}>Reveal Song</Button>
              }
              {displayHintSong &&
                <Button variant="success" className="hint-button" disabled>Reveal Song</Button>
              }
              {(pointsToday < 5 && !displayHintSong) &&
                <Button variant="danger" className="hint-button" disabled>Reveal Song</Button>
              }
            </div>
            <div className="col-8">
              {!displayHintSong &&
                <span>???</span>
              }
              {displayHintSong &&
                <span>Song</span>
              }
            </div>
          </div>
        </div>
        }
        
        {(!playerWon && lives.length > 0) && 
          <div className="container">
            <div className="container searchbar">
              <input className="form-control me-2" type="search" placeholder="Search for album title" onChange={(e) => handleChange(e.target.value)} value={input}/>
              <Button variant="outline-success" type="submit" onClick={(e) => newGuess(guess)}>Guess</Button>
              {/* Only show search results if search input isn't empty and an album guess isn't selected */}
              {(input && !guessSelected && !displayErrorMsg) &&
                <div className="search-results">
                  {results.map((result) => (
                    <div onClick={(e) => handleNewSubmit(result)} className="border-bottom container search-result">{result.title}</div>
                  ))}
                </div>
              }
            </div>
          </div>
        }

        {/* Display error message if something went wrong while sending requests */}
        {displayErrorMsg &&
          <div className="container error-submit-message">
            <p>{errorMessage}</p>
          </div>
        }

        <div className="options-rectangle">
          <div className="form-check">
            <input className="form-check-input" type="checkbox"  id="displayTitleCheck" defaultChecked onChange={(e) => setDisplayTitles(e.target.checked)}/>
            <label className="form-check-label" htmlFor="displayTitleCheck">Display album titles</label>
          </div>
          <div className="form-check">
            <input className="form-check-input" type="checkbox"  id="displayGuide" onChange={(e) => setDisplayGuide(!e.target.checked)}/>
            <label className="form-check-label" htmlFor="displayGuide">Hide guide</label>
          </div>
        </div>

        {(playerWon || lives.length > 0) && 
          <div className="container life-container">
            {lives.map((life) => (
              <div className="life">
                {life &&
                    <GiCompactDisc/>
                }
              </div>
            ))}
            {lostLives.map((lostLife) => (
              <div className="lost-life">
                {lostLife &&
                    <GiCrackedDisc/>
                }
              </div>
            ))}
          </div>
        }

        <div className="container info-row">
          <div className="container my-2">
            <div className="info-col d-flex flex-row text-center justify-content-center align-items-center">
              <div className="col-sm">Title</div>
              <div className="col-sm">Genre</div>
              <div className="col-sm">Subgenres</div>
              <div className="col-sm">Release Year</div>
              <div className="col-sm">Track Count</div>
              <div className="col-sm">Runtime</div>
              <div className="col-sm">Artist</div>
            </div>
          </div>
          {/* Loading indicator for a new guess */}
          {loadingGuess &&
            <div className="container mb-1">
              <div className="col justify-content-center d-flex">
                <div className="spinner-border row-guess-loading-spinner" role="status">
                  <span className="sr-only"></span>
                </div>
              </div>
            </div>
          }
          {/* If player lost, display album of the day details in top row */}
          {(!playerWon && lives.length == 0) &&
            <div className="container mb-1">
              <div className="d-flex flex-row text-center justify-content-center align-items-center">
                <div className="image-square col-sm" style={{backgroundImage: `url(${storedAlbum.cover_image})`}}>
                  {displayTitles && <span className="image-text">{storedAlbum.title}</span>}
                </div>   
                <div className="info-square text-square col-sm" style={{backgroundColor: "gray"}}>
                  {convertListToString(storedAlbum.genres)}
                </div>
                <div className="info-square text-square col-sm" style={{backgroundColor: "gray"}}>
                  {convertListToString(storedAlbum.styles)}
                </div>
                <div className="info-square col-sm " style={{backgroundColor: "gray"}}>{storedAlbum.year}</div>
                <div className="info-square col-sm " style={{backgroundColor: "gray"}}>{storedAlbum.track_count}</div>
                <div className="info-square col-sm " style={{backgroundColor: "gray"}}>{convertSecondsToDuration(storedAlbum.runtime)}</div>
                <div className="info-square col-sm" style={{backgroundColor: "gray"}}>
                  {convertListToString(storedAlbum.artists)}
                </div>
              </div>
            </div>
          }
          {guessedAlbums.map((album) => (
            <div className="container mb-1">
              <div className="d-flex flex-row text-center justify-content-center align-items-center">
                <div className="image-square col-sm" style={{backgroundImage: `url(${album.image})`}}>
                  {displayTitles && <span className="image-text">{album.title}</span>}
                </div>
                  
                {checkSharedElements(album.genres, storedAlbum.genres) == 1 &&
                  <div className="info-square text-square col-sm" style={{backgroundColor: "green"}}>
                    {convertListToString(album.genres)}
                  </div>
                }
                {checkSharedElements(album.genres, storedAlbum.genres) == 0 &&
                  <div className="info-square text-square col-sm" style={{backgroundColor: "#fcd512"}}>
                    {convertListToString(album.genres)}
                  </div>
                }
                {checkSharedElements(album.genres, storedAlbum.genres) == -1 &&
                  <div className="info-square text-square col-sm" style={{backgroundColor: "red"}}>
                    {convertListToString(album.genres)}
                  </div>
                }

                {checkSharedElements(album.styles, storedAlbum.styles) == 1 &&
                  <div className="info-square text-square col-sm" style={{backgroundColor: "green"}}>
                    {convertListToString(album.styles)}
                  </div>
                }
                {checkSharedElements(album.styles, storedAlbum.styles) == 0 &&
                  <div className="info-square text-square col-sm" style={{backgroundColor: "#fcd512"}}>
                    {convertListToString(album.styles)}
                  </div>
                }
                {checkSharedElements(album.styles, storedAlbum.styles) == -1 &&
                  <div className="info-square text-square col-sm" style={{backgroundColor: "red"}}>
                    {convertListToString(album.styles)}
                  </div>
                }

                {album.year != storedAlbum.year &&
                  <div className="info-square col-sm " style={{backgroundColor: "red"}}>
                    <div className="display-block info-arrow">
                      {album.year > storedAlbum.year && <ImArrowDown/>}
                      {album.year < storedAlbum.year && <ImArrowUp/>}
                    </div>
                    <p className="info-arrow-text">{album.year}</p>
                  </div>
                }
                {album.year == storedAlbum.year &&
                  <div className="info-square col-sm " style={{backgroundColor: "green"}}>{album.year}</div>
                }

                {album.track_count != storedAlbum.track_count &&
                  <div className="info-square col-sm " style={{backgroundColor: "red"}}>
                    <div className="display-block info-arrow">
                      {album.track_count > storedAlbum.track_count && <ImArrowDown/>}
                      {album.track_count < storedAlbum.track_count && <ImArrowUp/>}
                    </div>
                    <p className="info-arrow-text">{album.track_count}</p>
                  </div>
                }
                {album.track_count == storedAlbum.track_count &&
                  <div className="info-square col-sm " style={{backgroundColor: "green"}}>{album.track_count}</div>
                }

                {album.runtime != storedAlbum.runtime &&
                  <div className="info-square col-sm " style={{backgroundColor: "red"}}>
                    {/* If album runtime was not able to be parsed, display special message*/}
                    {(isNaN(album.runtime) || album.runtime == null) && 
                      <p>Could not find runtime</p>
                    }
                    {(!isNaN(album.runtime) && album.runtime != null) && 
                      <div>
                        <div className="display-block info-arrow">
                          {album.runtime > storedAlbum.runtime && <ImArrowDown/>}
                          {album.runtime < storedAlbum.runtime && <ImArrowUp/>}
                        </div>
                      </div>
                    }
                    <p className="info-arrow-text">{convertSecondsToDuration(album.runtime)}</p>
                  </div>
                }
                {album.runtime == storedAlbum.runtime &&
                  <div className="info-square col-sm " style={{backgroundColor: "green"}}>{convertSecondsToDuration(album.runtime)}</div>
                }

                {checkSharedElements(album.artists, storedAlbum.artists) == 1 &&
                  <div className="info-square col-sm" style={{backgroundColor: "green"}}>
                    {convertListToString(album.artists)}
                  </div>
                }
                {checkSharedElements(album.artists, storedAlbum.artists) == 0 &&
                  <div className="info-square col-sm" style={{backgroundColor: "#fcd512"}}>
                    {convertListToString(album.artists)}
                  </div>
                }
                {checkSharedElements(album.artists, storedAlbum.artists) == -1 &&
                  <div className="info-square col-sm" style={{backgroundColor: "red"}}>
                    {convertListToString(album.artists)}
                  </div>
                }
              </div>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}

export default App;
