package com.forge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workspace")
public class Workspace {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "owner_sub", nullable = false)
    private String ownerSub; // Auth0 'sub' claim of the creating user

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Workspace() {
        // JPA
    }

    public Workspace(String name, String ownerSub) {
        this.name = name;
        this.ownerSub = ownerSub;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getOwnerSub() { return ownerSub; }
    public Instant getCreatedAt() { return createdAt; }
}
