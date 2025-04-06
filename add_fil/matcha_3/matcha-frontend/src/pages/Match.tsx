import React, { useState } from "react";
import "../styles/Match.css";
import CommonImage from "../components/CommonImage.tsx";

interface Person {
    id: number;
    name: string;
    age: number;
    image: string;
}

const mockPeople: Person[] = [
    { id: 1, name: "Alice", age: 25, image: "../src/assets/images/profile.png" },
    { id: 2, name: "Bob", age: 28, image: "../src/assets/images/profile.png" },
    { id: 3, name: "Charlie", age: 30, image: "../src/assets/images/profile.png" }
];

const Match: React.FC = () => {
    const [people, setPeople] = useState<Person[]>(mockPeople);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleLike = () => {
        nextPerson();
    };

    const handleDislike = () => {
        nextPerson();
    };

    const nextPerson = () => {
        if (currentIndex < people.length - 1) {
            setCurrentIndex((prevIndex) => prevIndex + 1);
        } else {
            setPeople([]); // Reset people when finished
        }
    };

    if (people.length === 0) {
        return <h2 className="error-text-match">No more people to show.</h2>;
    }

    const currentPerson = people[currentIndex];

    return (
        <div className="match">
            <div className="card">
                <CommonImage src={currentPerson.image} alt={currentPerson.name} />
                <h3>{currentPerson.name}, {currentPerson.age}</h3>
            </div>
            <div className="buttons">
                <button className="dislike" onClick={handleDislike}>&#10060;</button>
                <button className="like" onClick={handleLike}>&#10084;</button>
            </div>
        </div>
    );
};

export default Match;
