package com.forge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "task")
public class Task {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.TODO;

    @Column(nullable = false)
    private int position;

    @Column(name = "assignee_sub")
    private String assigneeSub;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Task() {
        // JPA
    }

    public Task(Project project, String title) {
        this.project = project;
        this.title = title;
    }

    public UUID getId() { return id; }
    public Project getProject() { return project; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
    public String getAssigneeSub() { return assigneeSub; }
    public void setAssigneeSub(String assigneeSub) { this.assigneeSub = assigneeSub; }
    public Instant getCreatedAt() { return createdAt; }

    public enum TaskStatus { TODO, IN_PROGRESS, DONE }
}
