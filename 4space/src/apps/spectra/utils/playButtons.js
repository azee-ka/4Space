import { FaPlay } from 'react-icons/fa';

const PlayButton = () => (
    <div style={{
        backgroundColor: 'white',
        borderRadius: '20%',
        width: '46px',
        height: '30px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    }}>
        <FaPlay style={{
            color: 'black',
            fontSize: '16px'
        }} />
    </div>
);

export default PlayButton;