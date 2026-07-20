package com.forge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "user_preferences")
public class UserPreferences {

    @Id
    @Column(name = "owner_sub")
    private String ownerSub;

    @Column(nullable = false)
    private String theme;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected UserPreferences() {
        // JPA
    }

    public UserPreferences(String ownerSub, String theme) {
        this.ownerSub = ownerSub;
        this.theme = theme;
    }

    public String getOwnerSub() { return ownerSub; }
    public String getTheme() { return theme; }

    public void setTheme(String theme) {
        this.theme = theme;
        this.updatedAt = Instant.now();
    }

    public Instant getUpdatedAt() { return updatedAt; }
}
