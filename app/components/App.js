import React, { Component } from 'react'

class App extends Component {
    render(){
        return(
            <div style={styles.headerTab}>
                <p>test</p>
            </div>
        )
    }
}
const styles = {
    headerTab: {
        backgroundColor: '#99D3DF',
        width: '100%',
        height: '75px',
        flex: 1
    }
}


export default App