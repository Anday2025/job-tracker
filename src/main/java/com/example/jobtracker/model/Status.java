package com.example.jobtracker.model;

/**
 * Enum som representerer status for en jobbsøknad.
 */
public enum Status {

    /** Søknaden er planlagt, men ikke sendt */
    PLANLAGT,

    /** Søknaden er sendt */
    SOKT,

    /** Kandidaten er invitert til intervju */
    INTERVJU,

    /** Søknaden har fått avslag */
    AVSLATT,

    /** Kandidaten har mottatt tilbud */
    TILBUD
}