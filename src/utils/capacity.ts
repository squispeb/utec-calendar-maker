type CapacityLike = {
    vacancies: number;
    enrolled: number;
};

export function hasCapacityData(session: CapacityLike) {
    return session.vacancies > 0 || session.enrolled > 0;
}

export function getAvailableSeats(session: CapacityLike) {
    return Math.max(session.vacancies - session.enrolled, 0);
}

export function formatEnrollmentRatio(session: CapacityLike) {
    if (!hasCapacityData(session)) {
        return "Capacidad no reportada";
    }

    return `${session.enrolled}/${session.vacancies} matriculados/vacantes`;
}
