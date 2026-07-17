package com.forge.controller;

import com.forge.dto.TaskDto;
import com.forge.model.Project;
import com.forge.model.Task;
import com.forge.repository.ProjectRepository;
import com.forge.repository.TaskRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks")
public class TaskController {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public TaskController(TaskRepository taskRepository, ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping
    public List<TaskDto.Response> listTasks(
        @PathVariable UUID projectId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        findOwnedProjectOrThrow(projectId, jwt);
        return taskRepository.findByProjectIdOrderByPositionAsc(projectId)
            .stream()
            .map(TaskDto.Response::from)
            .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDto.Response createTask(
        @PathVariable UUID projectId,
        @Valid @RequestBody TaskDto.CreateRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        Project project = findOwnedProjectOrThrow(projectId, jwt);
        Task task = new Task(project, request.title());
        task.setAssigneeSub(jwt.getSubject());
        return TaskDto.Response.from(taskRepository.save(task));
    }

    @Transactional
    @PatchMapping("/{taskId}")
    public TaskDto.Response updateTask(
        @PathVariable UUID projectId,
        @PathVariable UUID taskId,
        @Valid @RequestBody TaskDto.UpdateRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        findOwnedProjectOrThrow(projectId, jwt);
        Task task = findTaskInProjectOrThrow(projectId, taskId);

        if (request.title() != null) {
            task.setTitle(request.title());
        }

        if (request.status() != null || request.position() != null) {
            reorder(task, projectId, request.status(), request.position());
        } else {
            taskRepository.save(task);
        }

        return TaskDto.Response.from(task);
    }

    /**
     * Moves {@code task} to {@code newPosition} (or the end, if omitted) within its
     * target status column, renumbering that column to a clean 0..n-1 sequence. If
     * the task is also changing columns, the column it's leaving is renumbered too
     * so no gap is left behind. A single-task PATCH otherwise has no way to keep
     * sibling positions consistent, since the client only knows about its own move.
     */
    private void reorder(Task task, UUID projectId, Task.TaskStatus newStatus, Integer newPosition) {
        Task.TaskStatus previousStatus = task.getStatus();
        Task.TaskStatus targetStatus = newStatus != null ? newStatus : previousStatus;

        List<Task> projectTasks = taskRepository.findByProjectIdOrderByPositionAsc(projectId);

        List<Task> targetColumn = projectTasks.stream()
            .filter(t -> t.getStatus() == targetStatus && !t.getId().equals(task.getId()))
            .collect(Collectors.toCollection(ArrayList::new));
        int insertIndex = newPosition == null ? targetColumn.size() : Math.clamp(newPosition, 0, targetColumn.size());
        targetColumn.add(insertIndex, task);

        task.setStatus(targetStatus);
        renumber(targetColumn);
        taskRepository.saveAll(targetColumn);

        if (targetStatus != previousStatus) {
            List<Task> sourceColumn = projectTasks.stream()
                .filter(t -> t.getStatus() == previousStatus && !t.getId().equals(task.getId()))
                .toList();
            renumber(sourceColumn);
            taskRepository.saveAll(sourceColumn);
        }
    }

    private void renumber(List<Task> tasks) {
        for (int i = 0; i < tasks.size(); i++) {
            tasks.get(i).setPosition(i);
        }
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(
        @PathVariable UUID projectId,
        @PathVariable UUID taskId,
        @AuthenticationPrincipal Jwt jwt
    ) {
        findOwnedProjectOrThrow(projectId, jwt);
        Task task = findTaskInProjectOrThrow(projectId, taskId);
        taskRepository.delete(task);
    }

    private Project findOwnedProjectOrThrow(UUID projectId, Jwt jwt) {
        return projectRepository.findByIdWithWorkspace(projectId)
            .filter(project -> project.getWorkspace().getOwnerSub().equals(jwt.getSubject()))
            .orElseThrow(() -> new NoSuchElementException("Project not found"));
    }

    private Task findTaskInProjectOrThrow(UUID projectId, UUID taskId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new NoSuchElementException("Task not found"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new NoSuchElementException("Task not found in this project");
        }
        return task;
    }
}