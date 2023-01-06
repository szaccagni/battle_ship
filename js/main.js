/*----- constants -----*/
const ships = [
    {
        name: 'CARRIER',
        width: 5,
        color: '#FFAD00',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [], 
        hits: 0,
    },
    {
        name: 'BATTLESHIP',
        width: 4,
        color: '#39ff14',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [],
        hits: 0,
    },
    {
        name: 'DESTROYER',
        width: 3,
        color: '#FF10F0',
        dom: null,
        translateCordinates: [], 
        rotated: -1,
        squaresOccupied: [],
        hits: 0,
    },
    {
        name:'SUBMARINE',
        width: 3,
        color: '#04d9ff',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [],
        hits: 0,
    },
    {
        name: 'PATROL',
        width: 2,
        color: '#FFF01F',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [],
        hits: 0,
    },
]

const numbers = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

class Player {
    constructor(id, automated) {
        this.id = id
        this.automated = automated
        this.name = (automated === true) ? 'Computer' : `Player ${this.id}` 
        this.ships = JSON.parse(JSON.stringify(ships))
        this.shipsSunk = 0
        this.placed = 0
        this.board = []
        // should this be in the constructor or somewhere else ?
        letters.forEach(letter => {
            for (let i = 1; i < numbers.length; i++) {
                const tile = {}
                tile.name = letter+numbers[i]
                tile.content = null  // filled with shipName, miss, or *shipName (if hit)
                this.board.push(tile)
            }
        })
        this.boardDom = ''
        this.attacksMade = []
        this.attackingShip = false // currently only updating for computer
    }
}

/*----- app's state (variables) -----*/
let player1, player2, curPlayer, curShip, gameStatus = 'waiting', predictMoves = [], animateInterval

/*----- cached element references -----*/
const body = document.querySelector('body')
const playComEl = document.getElementById('vsComputer')
const player1BoardEl = document.getElementById('player1Board')
const player2BoardEl = document.getElementById('player2Board')
const shipYard = document.getElementById('shipYard')
const resetBtn = document.getElementById('reset')
const readyBtn = document.getElementById('ready')
const msg = document.getElementById('msg')
const shipMsgContainers = document.querySelectorAll('.ship-msg-container')
const gridLabels = document.querySelectorAll('.grid-labels')
const subImg = document.getElementById('subImg')

/*----- event listeners -----*/
playComEl.addEventListener('click', buildGame)
player1BoardEl.addEventListener('dragover', dragOver)
player1BoardEl.addEventListener('drop', dragDrop)
resetBtn.addEventListener('click', resetGame)
readyBtn.addEventListener('click', startGame)

/*----- functions -----*/
function init() {
    render()
}

function buildGame() {
    player1 = new Player(1, false)
    player1.boardDom = player1BoardEl
    player2 = new Player(2, true)
    player2.boardDom = player2BoardEl
    curPlayer = player1
    gameStatus = 'building'
    render()
}

function resetGame() {
    curPlayer = null
    curShip = null
    player1 = null
    player2 = null
    gameStatus = 'waiting'
    render()
}

function startGame() {
    if (player2.automated === true) generateComputerBoard()
    gameStatus = 'playing'
    lockBoard()
    render()
}

function getCurShip(e) {
    if (!e.target.id) {
        curShip = curPlayer.ships.find(ship => ship.name === e.target.parentElement.id)
        curShip.dom = e.target.parentElement
    } else {
        curShip = curPlayer.ships.find(ship => ship.name === e.target.id)
        curShip.dom = e.target
    }
}

function dragStart(e) {
    getCurShip(e)
    curShip.shipGrabbedX = e.offsetX
    curShip.shipGrabbedY = e.offsetY
}

function dragOver(e) {
    const dropX = (e.offsetX - curShip.shipGrabbedX)
    const dropY = (e.offsetY - curShip.shipGrabbedY)
    // cannot drop ship on itself or another ship
    if (e.target !== curShip.dom && e.target !== curShip.dom.firstChild && e.target.parentElement.classList[0] !== 'ship') e.preventDefault()
}

function dragDrop(e) {
    e.preventDefault()
    const dropX = (Math.round((e.offsetX - curShip.shipGrabbedX) / 49) * 49)+2
    const dropY = (Math.round((e.offsetY - curShip.shipGrabbedY) / 49) * 49)+1
    if (getSquaresOccupied(dropX,dropY,null,1)) {
        dropShip(dropX,dropY)    
    }
}

function clickShip(e) {
    getCurShip(e)
    if (curShip && curShip.dom.parentElement.id.search('Board') > 0) {
        if (getSquaresOccupied(curShip.translateCordinates[0],curShip.translateCordinates[1],null,-1)) {
            curShip.rotated *= -1
            rotateShip()
        }
    }       
}

function getSquaresOccupied(x,y,starting,rotated){
    let startingSquare = starting
    let idxX = x
    let idxY = y
    // validate against placement off the board
    if (idxX < 1 || idxY < 1) {
        return false
    } 
    // get starting square
    // logic only for physically dropped ships
    if (!startingSquare) {
        idxX = Math.ceil(x / 49)
        idxY = Math.ceil(y / 49)
        startingSquare = letters[idxY-1]+numbers[idxX]
    }
    let squares = [startingSquare]
    const startLetter = startingSquare[0]
    const startNum = startingSquare.slice(1,startingSquare.length)
    // horizontal
    if (curShip.rotated*rotated === -1) {
        for (let i = 1; i < curShip.width; i++ ) {
            const numIdx = numbers.indexOf(startNum)
            const num = numbers[numIdx + i]
            const sqr = startLetter + num
            squares.push(sqr)     
        }
    } else { // vertical 
        for (let i = 1; i < curShip.width; i++ ) {
            const letterIdx = letters.indexOf(startLetter)
            const letter = letters[letterIdx + i]
            const sqr = letter + startNum
            squares.push(sqr)   
        }
    }
    // validate that squares are open
    if (squares.find(sqr => sqr.includes('undefined'))) {
        return false
    } else {
        return checkBoardPlacement(squares,rotated)
    }
}

function checkBoardPlacement(squaresArr, rotated) {
    let result = (rotated === -1) ? 1 : 0
    squaresArr.forEach(sqr => {
        const tile = curPlayer.board.find(tile => tile.name === sqr)
        result += (tile.content === null) ? 1 : 0
    })
    if (result === squaresArr.length) {
        updateBoardPlacement(squaresArr)
        return true
    } else {
        return false
    }
}

function updateBoardPlacement(squaresArr) {
    // check if ship is already placed on the board
    // if it is, remove
    let found = curPlayer.board.find(tile => tile.content === curShip.name)
    if (found) {
        for (let i = 0; i < curShip.width; i++) {
            found = curPlayer.board.find(tile => tile.content === curShip.name)
            found.content = null
        }
    }
    // update tiles with new position
    squaresArr.forEach(sqr => {
        const tile = curPlayer.board.find(tile => tile.name === sqr)
        tile.content = curShip.name
    })
    // update curShip squares occupied
    curShip.squaresOccupied = squaresArr
    // check curPlayer's placed ship count
    checkShipsPlaced()
}

function checkShipsPlaced() {
    let shipNames = []
    let placed = 0
    curPlayer.ships.forEach(ship => shipNames.push(ship.name))
    shipNames.forEach(ship => {
        if (curPlayer.board.find(tile => tile.content === ship)) placed += 1
    })
    curPlayer.placed = placed
    render()
}

function lockBoard() {
    const player1Ships = document.querySelectorAll('.ship')
    player1Ships.forEach(ship => {
        ship.removeEventListener('dragstart', dragStart)
        ship.draggable = false
    })  
    const player1ShipStyles = document.querySelectorAll('.ship-style')
    player1ShipStyles.forEach(ship => ship.removeEventListener('click', clickShip))
    player1BoardEl.removeEventListener('dragover', dragOver)

}

function unlockBoard() {
    player1BoardEl.addEventListener('dragover', dragOver)
}

function generateComputerBoard() {
    curPlayer = player2
    curPlayer.ships.forEach(ship => {
        let randStartSquare = ''
        // 0 translates to vertical and 1 translates to horizontal
        let randDirection = Math.round(Math.random() * 1)
        let x = 0, y = 0
        curShip = ship
        while (!getSquaresOccupied(x,y,randStartSquare,randDirection)) {
            randStartSquare = ''
            x = 0, y = 0
            while (!randStartSquare) {
                const randIdx = Math.round(Math.random() * (curPlayer.board.length-1))
                if (curPlayer.board[randIdx].content === null) {
                    randStartSquare = curPlayer.board[randIdx].name
                    x = 1, y = 1
                }
            }
        }
        curShip.rotated = (randDirection === 0) ? 1 : -1
    })
    changeTurns()
}

function changeTurns() {
    curPlayer = (curPlayer === player1) ? player2 : player1
    render()
    if (curPlayer.automated === true) {
        setTimeout(autoAttack, 1000)
    }
}

function attack(e) {
    // check if the board being clicked is the curplayer's board
    // since the click listener is currently only on the player2 board
    // player2 board can't be clicked when it is player2's turn
    if (e.target === curPlayer.boardDom) {
        return
    } else {
        if (e.target.classList[0] === 'miss' || e.target.classList[0] === 'hit') {
            msg.innerText += ' - you\'ve already attacked that space'
            return
        } else {
            render()
        }
    }
    const recipient = (curPlayer === player1) ? player2 : player1
    const idxX = Math.ceil(e.offsetX / 49)
    const idxY = Math.ceil(e.offsetY / 49)
    const target = letters[idxY-1] + numbers[idxX]
    if (curPlayer.attacksMade.includes(target)) {
        msg.innerText += ' - you\'ve already attacked that space'
        return
    } else {
        curPlayer.attacksMade.push(target)
    }
    // check board
    const boardTarget = recipient.board.find(tile => tile.name === target)
    if (boardTarget.content === null) {
        renderAttack(recipient, target, 'miss')
        boardTarget.content = 'miss'
        changeTurns()
    } else if (boardTarget.content !== 'miss' && boardTarget.content[0] !== '*') {
        renderAttack(recipient,target,'hit')
        checkForSink(recipient, recipient.ships.find(ship => ship.name === boardTarget.content))
        boardTarget.content = '*' + boardTarget.content
    }
}

function autoAttack() {
    const recipient = (curPlayer === player1) ? player2 : player1
    let randSquare = ''
    while (!randSquare) {
        const randIdx = Math.round(Math.random() * (recipient.board.length-1))
        let boardTarget = recipient.board[randIdx]
        if (predictMoves.length > 0) {
            const move = predictMoves.pop()
            const moveElem = recipient.board.find(elem => elem.name === move)
            boardTarget = moveElem   
        }
        if (curPlayer.attacksMade.includes(boardTarget.name)) {
            randSquare = ''
        } else if (boardTarget.content === null) {
            randSquare = boardTarget
            curPlayer.attacksMade.push(randSquare.name) 
            renderAttack(recipient,randSquare.name,'miss')
            boardTarget.content = 'miss'
            if (curPlayer.attackingShip === true && predictMoves.length === 0) findLastHit(recipient, curPlayer)
            changeTurns()
        } else if (boardTarget.content !== 'miss' && boardTarget.content[0] !== '*') {
            randSquare = boardTarget
            curPlayer.attacksMade.push(randSquare.name) 
            curPlayer.attackingShip = true
            boardTarget.content = '*' + boardTarget.content
            generatePredictMoves(boardTarget, recipient, curPlayer)
            renderAttack(recipient,randSquare.name,'hit')
            checkForSink(recipient, recipient.ships.find(ship => ship.name === boardTarget.content.slice(1,boardTarget.content.length)))
        }
    }
}

function findLastHit(recipient, attacker) {
    let lastHit = ''
    const dupAttacksMade = [...attacker.attacksMade]
    while (lastHit === '') {
        const elem = dupAttacksMade.pop()
        sqr = recipient.board.find(tile => tile.name === elem)
        if (sqr.content[0] === '*') lastHit = sqr
    }
    generatePredictMoves(lastHit, recipient, attacker)
}

function generatePredictMoves(tile, recipient, attacker) {
    predictMoves = []
    const letterIdx = letters.indexOf(tile.name[0])
    const numIdx = numbers.indexOf(tile.name.slice(1, tile.name.length))
    const fourSpaceVicinity = []
    const vicinityHits = []

    if (numIdx > 1) fourSpaceVicinity.push(tile.name[0]+numbers[numIdx-1])
    if (letterIdx > 0) fourSpaceVicinity.push(letters[letterIdx-1]+numbers[numIdx])
    if (numIdx < 10) fourSpaceVicinity.push(tile.name[0]+numbers[numIdx+1])
    if (letterIdx < 9) fourSpaceVicinity.push(letters[letterIdx+1]+numbers[numIdx])

    // check if there are any hits in the four space vicinity 
    fourSpaceVicinity.forEach(space => {
        const sqr = recipient.board.find(sqr => sqr.name === space)
        if (sqr.content !== null) {
            if (sqr.content[0] === '*') {
                vicinityHits.push(sqr)
            }
        }
    })

    if (vicinityHits.length > 0) {
        vicinityHits.forEach(sqr => {
            const newAttack = sqrToAttack(sqr.name, tile.name, recipient, attacker)
            predictMoves.push(newAttack)
        })
    } else {
        fourSpaceVicinity.forEach(space => {
            const sqr  = recipient.board.find(sqr => sqr.name === space)
            if (sqr.content !== 'miss') {
                predictMoves.push(sqr.name)
            }
        })
    }
}

function sqrToAttack(hit1, hit2, recipient, attacker) {
    let result = ''
    const hit1LetterIdx = letters.indexOf(hit1[0])
    const hit1NumIdx = numbers.indexOf(hit1.slice(1,hit1.length))
    const hit2LetterIdx = letters.indexOf(hit2[0])
    const hit2NumIdx = numbers.indexOf(hit2.slice(1,hit2.length))
    // vertical hit pattern
    if ( hit1NumIdx === hit2NumIdx) {
        let upIdx = hit1LetterIdx - 1
        let downIdx = ((hit1LetterIdx - 1) > 0) ? 99 : hit1LetterIdx + 1
        // check up
        while (upIdx >= 0 && result === '') {
            const checkSquare = letters[upIdx] + numbers[hit1NumIdx]
            if (attacker.attacksMade.includes(checkSquare)) {
                if (recipient.board.find(elem => elem.name === checkSquare).content === 'miss') {
                    upIdx = -1
                    downIdx = hit1LetterIdx + 1
                } else {
                    upIdx -= 1
                    if (upIdx === -1) downIdx = hit1LetterIdx + 1
                }
            } else {
                result = checkSquare
            }
        }
        // check down
        while (downIdx < 10 && result === '') {
            const checkSquare = letters[downIdx] + numbers[hit1NumIdx]
            if (attacker.attacksMade.includes(checkSquare)) {
                downIdx += 1
            } else {
                result = checkSquare
            }
        }
    // horizontal hit pattern
    } else {
        let leftIdx = hit1NumIdx - 1
        let rightIdx = ((hit1NumIdx - 1) > 1) ? 99 : hit1NumIdx + 1
        // check left
        while (leftIdx > 0 && result === '') {
            const checkSquare = letters[hit1LetterIdx] + numbers[leftIdx]
            if (attacker.attacksMade.includes(checkSquare)) {
                if (recipient.board.find(elem => elem.name === checkSquare).content === 'miss') {
                    leftIdx = -1
                    rightIdx = hit1NumIdx + 1
                } else {
                    leftIdx -= 1
                    if (leftIdx === 1) rightIdx = hit1NumIdx + 1
                }
            } else {
                result = checkSquare
            }
        }
        // check right
        while (rightIdx < 10 && result === '') {
            const checkSquare = letters[hit1LetterIdx] + numbers[rightIdx]
            if (attacker.attacksMade.includes(checkSquare)) {
                rightIdx += 1
            } else {
                result = checkSquare
            }
        }
    }
    return result
}

function checkForSink(player, hitShip) {
    hitShip.hits += 1
    if (hitShip.hits === hitShip.width) {
        curPlayer.attackingShip = false
        hitShip.squaresOccupied.forEach( sqr => {
            const hit = player.boardDom.querySelector(`#${sqr}`)
            hit.style.backgroundColor = hitShip.color
            if (curPlayer.automated === true) {
                hit.style.zIndex = '-1'
            }
        })
        if (curPlayer.automated === true) {
            predictMoves = []
            hitShip.dom.style.textDecoration = 'line-through'
            hitShip.dom.style.color = 'red'
            hitShip.dom.firstChild.style.color = 'red'
        }
        player.shipsSunk += 1
        if (player.shipsSunk === player.ships.length) {
            winner = (player === player1) ? player2 : player1
            gameStatus = 'over'
            render()
        } else {
            changeTurns()
        }
    } else {
        changeTurns()
    }
}

function switchImg(img1, img2) {
    const fullURL = subImg.src
    const imgSrc = fullURL.slice(fullURL.indexOf('static'),fullURL.length)
    const newImg = (imgSrc === img1) ? img2 : img1
    subImg.src = newImg
}

/*----- render functions -----*/
function render() {
    if (gameStatus === 'waiting') {
        playComEl.style.display = 'block'
        subImg.parentElement.style.display = 'flex'
        animateInterval = setInterval(switchImg, 1000, "static/Sub1.png", "static/Sub2.png")
        clearBoard()
        unlockBoard()
    } 
    if (gameStatus === 'building') {
        renderBuildBoard()
    }
    if (gameStatus === 'playing') {
        renderPlayBoard()
        renderShipsStatus()
    }
    if (gameStatus === 'over') {
        renderShipsStatus()
        msg.innerText = `${winner.name} Wins !`
        player2BoardEl.removeEventListener('click', attack)
        player2BoardEl.classList.remove('hover')
    }
}

function renderGridLabels(boardEl) {
    const lettersEl = boardEl.parentElement.parentElement.querySelector('.letters')
    const numbersEl = boardEl.parentElement.parentElement.querySelector('.numbers')
    letters.forEach(letter => {
        const letterDiv = document.createElement('div')
        letterDiv.innerText = letter
        lettersEl.appendChild(letterDiv)
    })
    numbers.forEach(number => {
        const numberDiv = document.createElement('div')
        numberDiv.innerText = number
        numbersEl.appendChild(numberDiv)
    })
}

function renderShips(player) {
    player.ships.forEach( ship => {
        const newShip = document.createElement('div')
        const newShipStyle = document.createElement('div')
        newShip.appendChild(newShipStyle)
        newShip.setAttribute('draggable', true)
        newShip.setAttribute('class', 'ship')
        newShip.setAttribute('id', ship.name)
        newShip.style.width = `${ship.width * 3}rem`
        newShip.addEventListener('dragstart', dragStart)
        newShipStyle.setAttribute('class', 'ship-style')
        newShipStyle.style.backgroundColor = ship.color
        newShipStyle.style.width = `${ship.width * 3}rem`
        newShipStyle.innerText = ship.name
        newShipStyle.addEventListener('click', clickShip)
        shipYard.appendChild(newShip)
    })
}

function dropShip(x,y) {
    curShip.dom.style.transform = `translate(${x}px,${y}px)`
    curShip.translateCordinates = [x,y]
    curShip.dom.style.position = 'absolute'
    curShip.dom.classList.add('placed')
    player1BoardEl.appendChild(curShip.dom)
}

function rotateShip() {
    curShip.dom.style.width = curShip.rotated === -1 ? `${curShip.width * 3}rem` : '3rem'
    let rotateBy
    if (curShip.width % 2 === 0) {
        if (curShip.rotated === 1) {
            rotateBy = (curShip.width * 12) + (25 * (curShip.width/2 - 1)) - (curShip.width/2 - 1)
        } 
    } else {
        if (curShip.rotated === 1) {
            rotateBy = (Math.round(((curShip.width * 12) + 25)/48) * 48) + 1  
        } 
    }
    curShip.dom.firstChild.style.transform = curShip.rotated === -1 ? '' : `translate(-${rotateBy}px,${rotateBy}px) rotate(90deg)`
}

function renderShipsStatus() {
    const sunk1 = player1.shipsSunk
    const floating1 = player1.ships.length - sunk1 
    const sunk2 = player2.shipsSunk
    const floating2 = player2.ships.length - sunk2
    player1BoardEl.parentElement.parentElement.querySelector('.afloat').innerText = `${player1.name} Ships Afloat: ${floating1}`
    player1BoardEl.parentElement.parentElement.querySelector('.sunk').innerText = `${player1.name} Ships Sunk: ${sunk1}`
    player2BoardEl.parentElement.parentElement.querySelector('.afloat').innerText = `${player2.name} Ships Afloat: ${floating2}`
    player2BoardEl.parentElement.parentElement.querySelector('.sunk').innerText = `${player2.name} Ships Sunk: ${sunk2}`
}

function renderAttack(player, tile, result) {
    const attack = document.createElement('div')
    attack.classList.add(result)
    const letter = tile[0]
    const num = tile.slice(1,tile.length)
    const x = ((numbers.indexOf(num)-1) * 49) + 8
    const y = (letters.indexOf(letter) * 49) + 8
    attack.style.transform = `translate(${x}px,${y}px)`
    attack.id = tile
    player.boardDom.append(attack)
}

function renderPlayBoard() {
    body.style.margin = '1rem 3rem 1rem 3rem'
    msg.innerText = `${curPlayer.name}'s Move`
    msg.style.marginLeft = ''
    readyBtn.style.display = 'none'
    player2BoardEl.style.display = 'block'
    player2BoardEl.parentElement.parentElement.style.display = 'grid'
    player2BoardEl.classList.add('hover')
    if (player2BoardEl.parentElement.parentElement.querySelector('.letters').children.length === 0) {
        renderGridLabels(player2BoardEl)
    }
    shipMsgContainers.forEach(msgContainer => msgContainer.style.display = 'block')
    gridLabels.forEach(gridLabel => gridLabel.style.gridTemplateRows = '4rem 3.1rem auto')
    player2BoardEl.addEventListener('click', attack)
}

function renderBuildBoard() {
    clearInterval(animateInterval)
    subImg.parentElement.style.display = 'none'
    msg.innerText = 'Place Your Ships'
    playComEl.style.display = 'none'
    resetBtn.style.display = 'block'
    player1BoardEl.style.display = 'block'
    player1BoardEl.parentElement.parentElement.style.display = 'grid'
    shipYard.style.display = 'block'
    if (player1BoardEl.parentElement.parentElement.querySelector('.letters').children.length === 0) {
        renderGridLabels(player1BoardEl)
    }
    if (!document.querySelector('.ship')) {
        renderShips(player1)
    }
    if (curPlayer.placed === ships.length) {
        readyBtn.style.display = 'block'
        msg.innerText = '<--- click when you\'re happy with your ship placement'
        msg.style.marginLeft = '20px'
    }
}

function clearBoard() {
    body.style.margin = '5rem 3rem 1rem 3rem'
    msg.innerText = ''
    resetBtn.style.display = 'none'
    readyBtn.style.display = 'none'
    player1BoardEl.style.display = 'none'
    player1BoardEl.parentElement.parentElement.style.display = 'none'
    shipMsgContainers.forEach( msgContainer => msgContainer.style.display = 'none')
    player2BoardEl.style.display = 'none'
    player2BoardEl.parentElement.parentElement.style.display = 'none'
    gridLabels.forEach(gridLabel => gridLabel.style.gridTemplateRows = '3.1rem auto')
    shipYard.style.display = 'none'
    predictMoves = []

    if (document.querySelector('.ship')) {
        document.querySelectorAll('.ship').forEach(ship => ship.remove())
    }
    if (player1BoardEl.parentElement.parentElement.querySelector('.letters').children.length > 0) {
        const letters = Array.from(player1BoardEl.parentElement.parentElement.querySelector('.letters').children)
        letters.forEach( letter => letter.remove())
    }
    if (player1BoardEl.parentElement.parentElement.querySelector('.numbers').children.length > 0) {
        const numbers = Array.from(player1BoardEl.parentElement.parentElement.querySelector('.numbers').children)
        numbers.forEach(number => number.remove())
    }
    if (player1BoardEl.querySelectorAll('.miss')) {
        const misses = player1BoardEl.querySelectorAll('.miss')
        misses.forEach(miss => miss.remove())
    }
    if (player1BoardEl.querySelectorAll('.hit')) {
        const hits = player1BoardEl.querySelectorAll('.hit')
        hits.forEach(hit => hit.remove())
    }
    if (player2BoardEl.parentElement.parentElement.querySelector('.letters').children.length > 0) {
        const letters = Array.from(player2BoardEl.parentElement.parentElement.querySelector('.letters').children)
        letters.forEach( letter => letter.remove())
    }
    if (player2BoardEl.parentElement.parentElement.querySelector('.numbers').children.length > 0) {
        const numbers = Array.from(player2BoardEl.parentElement.parentElement.querySelector('.numbers').children)
        numbers.forEach(number => number.remove())
    }
    if (player2BoardEl.querySelectorAll('.miss')) {
        const misses = player2BoardEl.querySelectorAll('.miss')
        misses.forEach(miss => miss.remove())
    }
    if (player2BoardEl.querySelectorAll('.hit')) {
        const hits = player2BoardEl.querySelectorAll('.hit')
        hits.forEach(hit => hit.remove())
    }
}


init()