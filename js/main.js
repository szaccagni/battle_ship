/*----- constants -----*/

ships = [
    {
        name: 'CARRIER',
        width: 5,
        color: '#FFAD00',
        translateCordinates: [],
        squaresOccupied: [], 
        dom: null
    },
    {
        name: 'BATTLESHIP',
        width: 4,
        color: '#39ff14',
        translateCordinates: [],
        squaresOccupied: [],
        dom: null
    },
    {
        name: 'DESTROYER',
        width: 3,
        color: '#FF10F0',
        translateCordinates: [], 
        squaresOccupied: [],
        dom: null
    },
    {
        name:'SUBMARINE',
        width: 3,
        color: '#04d9ff',
        translateCordinates: [],
        squaresOccupied: [],
        dom: null
    },
    {
        name: 'PATROL',
        width: 2,
        color: '#FFF01F',
        translateCordinates: [],
        squaresOccupied: [],
        dom: null
    },
]

class Player {
    constructor(id, automated) {
        this.id = id
        this.automated = automated
        this.ships = [...ships]
    }
}


/*----- app's state (variables) -----*/
let player1, player2, curPlayer, curShip

/*----- cached element references -----*/
const playComEl = document.getElementById('vsComputer')
const player1BoardEl = document.getElementById('player1Board')


/*----- event listeners -----*/
playComEl.addEventListener('click', startGame)
player1BoardEl.addEventListener('dragover', dragOver)
player1BoardEl.addEventListener('drop', dragDrop)


/*----- functions -----*/

function startGame() {
    playComEl.style.display = 'none'
    player1 = new Player(1, false)
    player2 = new Player(2, true)
    player1BoardEl.style.display = 'block'
    buildShips(player1)
    curPlayer = player1
}

function buildShips(player) {
    player.ships.forEach( ship => {
        const newShip = document.createElement('div')
        newShip.setAttribute('class', 'ship')
        newShip.setAttribute('draggable', true)
        newShip.setAttribute('id', ship.name)
        newShip.style.backgroundColor = ship.color
        newShip.style.width = `${ship.width * 3}rem`
        newShip.innerText = ship.name
        newShip.addEventListener('dragstart', dragStart)
        newShip.addEventListener('click', rotate)
        document.querySelector('#shipYard').appendChild(newShip)
    })
}

function dragStart(e) {
    curShip = curPlayer.ships.find(ship => ship.name === e.target.id)
    curShip.dom = e.target
    curShip.shipGrabbedX = e.offsetX
    curShip.shipGrabbedY = e.offsetY
}

function dragOver(e) {
    if(e.target !== curShip.dom) e.preventDefault()
}

function dragDrop(e) {
    e.preventDefault()
    const dropX = calcCordinate(e.offsetX, curShip.shipGrabbedX)+2
    const dropY = calcCordinate(e.offsetY, curShip.shipGrabbedY)+1
    logCordinates(dropX,dropY)
    // validate that the dropped ship is in a correct place
    // might want to move this to some kind of render function but idk
    curShip.dom.style.transform = `translate(${dropX}px,${dropY}px)`
    curShip.dom.style.position = 'absolute'
    curShip.dom.classList.add('placed')
    player1BoardEl.appendChild(curShip.dom)
}

function calcCordinate(drop,grab) {
    let result = Math.round((drop - grab) / 49) * 49
    return result
}

function logCordinates(x,y) {
    const ship = curPlayer.ships.find(ship => ship.name === curShip.dom.id)
    ship.translateCordinates = [x,y]
}

function rotate(e) {
    curShip = curPlayer.ships.find(ship => ship.name === e.target.id)
    curShip.dom = e.target
    if (curShip && curShip.dom.parentElement.id.search('Board') > 0) {
        let transform = curShip.dom.style.transform
        if (transform.search('rotate') > 0) {
            curShip.dom.style.transform = transform.substr(0,transform.search(' rotate'))
        } else {
            curShip.dom.style.transform += ' rotate(90deg)'
        }
    }
        
}

// // testing
// player1BoardEl.addEventListener('click', test)
// function test(e){
//     testEl = curPlayer.ships.find(ship => ship.name === curShip.dom.id)
//     testEl.test = 'hi'
//     console.log(testEl)

// }