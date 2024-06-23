const RingProgress = ({ progress }) => {

    console.log(progress)

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg className="ring-progress" width="100" height="100" viewBox="0 0 100 100">
            <circle
                className="ring-progress-background"
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
            />
            <circle
                className="ring-progress-fill"
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#00ada4"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transformOrigin: '50% 50%', animation: 'fillAnimation 0.5s forwards' }}
            />
        </svg>
    );
};

export default RingProgress;
