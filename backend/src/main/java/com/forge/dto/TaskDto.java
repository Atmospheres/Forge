package com.forge.dto;

import com.forge.model.Task;
import com.forge.validation.NullOrNotBlank;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.UUID;

public class TaskDto {

    // Response shape
    public record Response(
        UUID id,
        String title,
        Task.TaskStatus status,
        int position,
        String assigneeSub,
        Instant createdAt
    ) {
        public static Response from(Task task) {
            return new Response(
                task.getId(),
                task.getTitle(),
                task.getStatus(),
                task.getPosition(),
                task.getAssigneeSub(),
                task.getCreatedAt()
            );
        }
    }

    // Request shape for creating a task — mirrors the Zod schema used on the frontend
    public record CreateRequest(
        @NotBlank String title
    ) {}

    // Request shape for updating status/position (e.g. drag-and-drop reorder)
    public record UpdateRequest(
        @NullOrNotBlank String title,
        Task.TaskStatus status,
        Integer position
    ) {}
}
